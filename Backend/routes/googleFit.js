import express from "express";

const router = express.Router();

/**
 * Test route - to confirm Google Fit routes are working
 * GET /api/googlefit/
 */
router.get("/", (req, res) => {
  res.json({ message: "Google Fit API route is working!" });
});

/**
 * Example route - Fetch vitals from Google Fit
 * In production, replace mock data with real Google Fit API integration.
 * GET /api/googlefit/vitals
 */
router.get("/vitals", async (req, res) => {
  try {
    // 🔹 For now returning mock vitals
    const vitals = {
      heartRate: 72,
      steps: 8500,
      sleepHours: 7.2,
      caloriesBurned: 450,
    };

    res.json(vitals);
  } catch (error) {
    console.error("Error fetching vitals:", error);
    res.status(500).json({ error: "Failed to fetch vitals from Google Fit" });
  }
});

/**
 * Example route - Health assessment based on vitals
 * GET /api/googlefit/assessment
 */
router.get("/assessment", async (req, res) => {
  try {
    // 🔹 For now, use simple mock assessment logic
    const assessment = {
      overall: { level: "moderate", score: 50 },
      categories: {
        anxiety: { level: "low", score: 10 },
        depression: { level: "moderate", score: 30 },
        stress: { level: "moderate", score: 25 },
        nervousBreakdown: { level: "low", score: 5 },
        selfHarmRisk: { level: "low", score: 2 },
      },
      notes: [
        "Vitals are within acceptable ranges.",
        "Maintain regular sleep and activity patterns.",
      ],
    };

    res.json(assessment);
  } catch (error) {
    console.error("Error generating assessment:", error);
    res.status(500).json({ error: "Failed to generate assessment" });
  }
});

// ✅ Export router as default (important!)
export default router;
