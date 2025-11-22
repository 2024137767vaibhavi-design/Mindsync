import express from "express";
import { google } from "googleapis";
import Token from "../models/Token.js";

const router = express.Router();

// OAuth2 client setup
const getRedirectUri = () => {
  const baseUrl = process.env.BASE_URL || process.env.FRONTEND_URL || "https://mindsync-tu30.onrender.com";
  return `${baseUrl}/api/googlefit/oauth2callback`;
};

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,        // from Google Cloud
  process.env.GOOGLE_CLIENT_SECRET,    // from Google Cloud
  getRedirectUri() // your redirect URI
);

// Step 1: Redirect user to Google
router.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
      "https://www.googleapis.com/auth/fitness.sleep.read",
      "https://www.googleapis.com/auth/userinfo.email",
    ],
    prompt: "consent", // Force consent screen to get refresh token
  });
  res.redirect(url);
});

// Step 2: Handle callback from Google
router.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || "https://mindsync-tu30.onrender.com/";
  
  if (!code) {
    return res.redirect(`${frontendUrl}/dashboard.html?error=no_code`);
  }

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens in the database
    const tokenData = new Token({
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiryDate: tokens.expiry_date,
    });
    await tokenData.save();

    console.log("Google Fit tokens saved:", tokens);
    // Redirect back to frontend dashboard with success message
    const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || "https://mindsync-tu30.onrender.com/";
    res.redirect(`${frontendUrl}/dashboard.html?connected=true`);
  } catch (err) {
    console.error("OAuth callback error:", err);
    const frontendUrl = process.env.FRONTEND_URL || process.env.BASE_URL || "https://mindsync-tu30.onrender.com/";
    res.redirect(`${frontendUrl}/dashboard.html?error=connection_failed`);
  }
});

// Check connection status
router.get("/status", async (req, res) => {
  try {
    const token = await Token.findOne().sort({ createdAt: -1 });
    if (!token) {
      return res.json({ connected: false });
    }

    // Check if token is expired
    const now = new Date();
    const expiryDate = new Date(token.expiryDate);
    if (now >= expiryDate) {
      // Token expired, but refresh token might still work
      return res.json({ connected: false, expired: true });
    }

    res.json({ connected: true, expiryDate: token.expiryDate });
  } catch (err) {
    console.error("Error checking Google Fit status:", err);
    res.json({ connected: false, error: err.message });
  }
});

// Fetch comprehensive fitness data (vitals)
router.get("/vitals", async (req, res) => {
  try {
    const token = await Token.findOne().sort({ createdAt: -1 });
    if (!token) {
      return res.status(404).json({ error: "No tokens found. Please connect Google Fit first." });
    }

    // Refresh token if expired
    oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
    });

    // Check if token needs refresh
    const now = new Date();
    const expiryDate = new Date(token.expiryDate);
    if (now >= expiryDate && token.refreshToken) {
      try {
        const { credentials } = await oauth2Client.refreshAccessToken();
        oauth2Client.setCredentials(credentials);
        
        // Update token in database
        token.accessToken = credentials.access_token;
        token.expiryDate = credentials.expiry_date;
        await token.save();
      } catch (refreshErr) {
        console.error("Token refresh failed:", refreshErr);
      }
    }

    const fitness = google.fitness({ version: "v1", auth: oauth2Client });
    const endTime = Date.now();
    const startTime = endTime - (7 * 24 * 60 * 60 * 1000); // Last 7 days

    // Fetch multiple data types in parallel
    const [stepsData, heartRateData, sleepData, activityData] = await Promise.all([
      // Steps
      fitness.users.dataset.aggregate({
        userId: "me",
        requestBody: {
          aggregateBy: [{
            dataTypeName: "com.google.step_count.delta",
            dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime,
          endTimeMillis: endTime,
        },
      }).catch(() => null),

      // Heart Rate
      fitness.users.dataset.aggregate({
        userId: "me",
        requestBody: {
          aggregateBy: [{
            dataTypeName: "com.google.heart_rate.bpm",
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime,
          endTimeMillis: endTime,
        },
      }).catch(() => null),

      // Sleep
      fitness.users.dataset.aggregate({
        userId: "me",
        requestBody: {
          aggregateBy: [{
            dataTypeName: "com.google.sleep.segment",
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime,
          endTimeMillis: endTime,
        },
      }).catch(() => null),

      // Activity (for energy estimation)
      fitness.users.dataset.aggregate({
        userId: "me",
        requestBody: {
          aggregateBy: [{
            dataTypeName: "com.google.activity.segment",
          }],
          bucketByTime: { durationMillis: 86400000 },
          startTimeMillis: startTime,
          endTimeMillis: endTime,
        },
      }).catch(() => null),
    ]);

    // Process and format the data
    const labels = [];
    const steps = [];
    const heartRate = [];
    const sleepHours = [];
    const energy = [];
    const stressLevel = [];
    const temperature = [];
    const bp = [];

    // Generate date labels for last 7 days
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      labels.push(date.toLocaleDateString('en-US', { weekday: 'short' }));
    }

    // Create a map to store data by date
    const dataByDate = new Map();
    
    // Initialize all 7 days with defaults
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      dataByDate.set(dateKey, {
        steps: 5000,
        heartRate: 72,
        sleepHours: 7.0,
        energy: 60,
        stressLevel: 50,
        temperature: 36.6,
        bp: "120/80"
      });
    }

    // Process steps data
    if (stepsData?.data?.bucket) {
      stepsData.data.bucket.forEach((bucket) => {
        const startTime = bucket.startTimeMillis;
        const date = new Date(startTime);
        const dateKey = date.toISOString().split('T')[0];
        const value = bucket.dataset?.[0]?.point?.[0]?.value?.[0]?.intVal || 0;
        if (dataByDate.has(dateKey)) {
          dataByDate.get(dateKey).steps = value;
        }
      });
    }

    // Process heart rate data (average per day)
    if (heartRateData?.data?.bucket) {
      heartRateData.data.bucket.forEach((bucket) => {
        const startTime = bucket.startTimeMillis;
        const date = new Date(startTime);
        const dateKey = date.toISOString().split('T')[0];
        const points = bucket.dataset?.[0]?.point || [];
        if (points.length > 0 && dataByDate.has(dateKey)) {
          const values = points.map(p => p.value?.[0]?.fpVal).filter(v => v !== undefined && v !== null);
          if (values.length > 0) {
            const avg = Math.round(values.reduce((a, b) => a + b, 0) / values.length);
            dataByDate.get(dateKey).heartRate = avg;
          }
        }
      });
    }

    // Process sleep data (total sleep hours per day)
    if (sleepData?.data?.bucket) {
      sleepData.data.bucket.forEach((bucket) => {
        const startTime = bucket.startTimeMillis;
        const date = new Date(startTime);
        const dateKey = date.toISOString().split('T')[0];
        const points = bucket.dataset?.[0]?.point || [];
        if (dataByDate.has(dateKey)) {
          let totalSleepMs = 0;
          points.forEach(point => {
            const start = point.startTimeNanos ? parseInt(point.startTimeNanos) / 1000000 : 0;
            const end = point.endTimeNanos ? parseInt(point.endTimeNanos) / 1000000 : 0;
            if (end > start) {
              totalSleepMs += (end - start);
            }
          });
          const sleepHoursValue = totalSleepMs / (1000 * 60 * 60); // Convert to hours
          if (sleepHoursValue > 0) {
            dataByDate.get(dateKey).sleepHours = Math.round(sleepHoursValue * 10) / 10;
          }
        }
      });
    }

    // Convert map to arrays in correct order
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split('T')[0];
      const dayData = dataByDate.get(dateKey);
      
      steps.push(dayData.steps);
      heartRate.push(dayData.heartRate);
      sleepHours.push(dayData.sleepHours);
      
      // Calculate energy and stress based on activity and sleep
      const activityLevel = dayData.steps > 8000 ? 80 : dayData.steps > 5000 ? 70 : 60;
      energy.push(activityLevel);
      stressLevel.push(dayData.sleepHours < 6 ? 60 : dayData.sleepHours < 7 ? 50 : 40);
      temperature.push(dayData.temperature);
      bp.push(dayData.bp);
    }

    // Return formatted data matching vitals.json structure
    res.json({
      labels,
      steps,
      heartRate,
      sleepHours,
      bp,
      energy,
      stressLevel,
      temperature,
      source: "google-fit"
    });
  } catch (err) {
    console.error("Error fetching Google Fit vitals:", err);
    res.status(500).json({ error: "Failed to fetch fitness data", details: err.message });
  }
});

export default router;
