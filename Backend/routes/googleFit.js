import express from "express";
import { google } from "googleapis";
import Token from "../models/Token.js";

const router = express.Router();

// OAuth2 client setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,        // from Google Cloud
  process.env.GOOGLE_CLIENT_SECRET,    // from Google Cloud
  `${process.env.BASE_URL}/oauth2callback` // your redirect URI
);

// Step 1: Redirect user to Google
router.get("/auth", (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: [
      "https://www.googleapis.com/auth/fitness.activity.read",
      "https://www.googleapis.com/auth/fitness.body.read",
    ],
  });
  res.redirect(url);
});

// Step 2: Handle callback from Google
router.get("/oauth2callback", async (req, res) => {
  const { code } = req.query;
  if (!code) return res.status(400).send("No code provided");

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
    res.send("✅ Google Fit connected successfully!");
  } catch (err) {
    console.error("OAuth callback error:", err);
    res.status(500).send("Failed to connect Google Fit");
  }
});

// Fetch fitness data
router.get("/fitness-data", async (req, res) => {
  try {
    const token = await Token.findOne();
    if (!token) return res.status(404).send("No tokens found. Please connect Google Fit first.");

    oauth2Client.setCredentials({
      access_token: token.accessToken,
      refresh_token: token.refreshToken,
      expiry_date: token.expiryDate,
    });

    const fitness = google.fitness({ version: "v1", auth: oauth2Client });
    const response = await fitness.users.dataset.aggregate({
      userId: "me",
      requestBody: {
        aggregateBy: [
          {
            dataTypeName: "com.google.step_count.delta",
            dataSourceId: "derived:com.google.step_count.delta:com.google.android.gms:estimated_steps",
          },
        ],
        bucketByTime: { durationMillis: 86400000 },
        startTimeMillis: Date.now() - 7 * 24 * 60 * 60 * 1000, // Last 7 days
        endTimeMillis: Date.now(),
      },
    });

    res.json(response.data);
  } catch (err) {
    console.error("Error fetching fitness data:", err);
    res.status(500).send("Failed to fetch fitness data");
  }
});

export default router;
