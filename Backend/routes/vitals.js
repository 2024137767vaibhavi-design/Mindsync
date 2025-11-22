import express from "express";

const router = express.Router();

const vitals = {
  heartRate: "72 bpm",
  stressLevel: "Moderate",
  sleepHours: "6.5 hrs",
  bp: "120/80",
  ecg: "Normal",
  temperature: "98.6°F",
  energy: "High"
};

// Health check endpoint for debugging
router.get("/health", (req, res) => {
  res.json({ status: "ok", message: "Vitals route is working" });
});

router.get("/", (req, res) => {
  if (!vitals || typeof vitals !== "object") {
    return res.status(500).json({ error: "Vitals data missing or invalid" });
  }
  res.json(vitals);
});

// Convert various string formats to numbers we can score
function parseNumber(value) {
  if (!value && value !== 0) return NaN;
  if (typeof value === "number") return value;
  const cleaned = String(value).replace(/[^\d.\/-]/g, "");
  if (cleaned.includes("/")) return NaN; // handled separately for BP
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? NaN : parsed;
}

function parseHeartRate(value) {
  const n = parseNumber(value);
  return isNaN(n) ? 72 : n;
}

function parseStress(value) {
  if (!value) return 40;
  const lower = String(value).toLowerCase();
  if (lower.includes("%")) {
    const n = parseNumber(value);
    return isNaN(n) ? 40 : Math.max(0, Math.min(100, n));
  }
  if (lower.includes("low")) return 20;
  if (lower.includes("moderate") || lower.includes("medium")) return 50;
  if (lower.includes("high")) return 80;
  return 40;
}

function parseSleepHours(value) {
  const n = parseNumber(value);
  return isNaN(n) ? 7 : n;
}

function parseEnergy(value) {
  if (!value) return 60;
  const lower = String(value).toLowerCase();
  if (lower.includes("%")) {
    const n = parseNumber(value);
    return isNaN(n) ? 60 : Math.max(0, Math.min(100, n));
  }
  if (lower.includes("low")) return 25;
  if (lower.includes("medium") || lower.includes("moderate")) return 55;
  if (lower.includes("high")) return 80;
  return 60;
}

function parseBP(value) {
  if (!value) return { sys: 120, dia: 80 };
  const parts = String(value).replace(/[^\d/]/g, "").split("/");
  const sys = parseInt(parts[0], 10);
  const dia = parseInt(parts[1], 10);
  return {
    sys: isFinite(sys) ? sys : 120,
    dia: isFinite(dia) ? dia : 80
  };
}

function parseTemperature(value) {
  if (!value) return 36.8;
  const lower = String(value).toLowerCase();
  const n = parseNumber(value);
  if (isNaN(n)) return 36.8;
  // Convert F to C if likely Fahrenheit
  const isF = lower.includes("f") || n > 45;
  return isF ? (n - 32) * (5 / 9) : n;
}

function levelFromScore(score) {
  if (score >= 70) return "high";
  if (score >= 40) return "moderate";
  return "low";
}

function clamp01(x) {
  return Math.max(0, Math.min(1, x));
}

// Heuristic scoring. Not a diagnosis.
function computeAssessment(v) {
  const hr = parseHeartRate(v.heartRate);
  const stress = parseStress(v.stressLevel); // 0-100
  const sleep = parseSleepHours(v.sleepHours); // hours
  const energy = parseEnergy(v.energy); // 0-100
  const { sys, dia } = parseBP(v.bp);
  const tempC = parseTemperature(v.temperature);

  // Normalized helpers
  const sleepDebt01 = clamp01((7 - sleep) / 4); // <3h -> ~1, 7h -> 0
  const highHR01 = clamp01((hr - 80) / 40); // 80-120 bpm maps 0..1
  const stress01 = stress / 100;
  const lowEnergy01 = clamp01((60 - energy) / 60); // 60% -> 0, 0% -> 1
  const highBP01 = clamp01(((sys - 130) / 30 + (dia - 85) / 20) / 2);
  const fever01 = clamp01((tempC - 37.5) / 2);

  const anxietyScore = Math.round(
    100 * (0.45 * stress01 + 0.35 * highHR01 + 0.20 * sleepDebt01)
  );

  const depressionScore = Math.round(
    100 * (0.5 * lowEnergy01 + 0.3 * sleepDebt01 + 0.2 * stress01)
  );

  const stressScore = Math.round(
    100 * (0.6 * stress01 + 0.25 * highBP01 + 0.15 * fever01)
  );

  const breakdownScore = Math.round(
    100 * (0.5 * stress01 + 0.3 * sleepDebt01 + 0.2 * highHR01)
  );

  const selfHarmScore = Math.round(
    100 * (0.45 * depressionScore / 100 + 0.35 * stress01 + 0.20 * sleepDebt01)
  );

  const categories = {
    anxiety: { score: anxietyScore, level: levelFromScore(anxietyScore) },
    depression: { score: depressionScore, level: levelFromScore(depressionScore) },
    stress: { score: stressScore, level: levelFromScore(stressScore) },
    nervousBreakdown: { score: breakdownScore, level: levelFromScore(breakdownScore) },
    selfHarmRisk: { score: selfHarmScore, level: levelFromScore(selfHarmScore) }
  };

  const overallScore = Math.round(
    (anxietyScore + depressionScore + stressScore + breakdownScore + selfHarmScore) / 5
  );

  const insights = [];
  if (stress >= 70) insights.push("Elevated stress indicated by vitals.");
  if (sleep < 6) insights.push("Sleep duration appears low (<6h).");
  if (hr > 100) insights.push("Resting heart rate is high.");
  if (sys >= 140 || dia >= 90) insights.push("Blood pressure is elevated.");
  if (energy <= 30) insights.push("Reported energy is very low.");

  return {
    categories,
    overall: { score: overallScore, level: levelFromScore(overallScore) },
    notes: insights,
    disclaimer:
      "Heuristic wellbeing assessment from vitals for support only. Not medical advice or diagnosis. If you are in crisis or considering self-harm, seek immediate help or contact local emergency services."
  };
}

router.get("/assessment", (req, res) => {
  try {
    const result = computeAssessment(vitals);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: "Failed to compute assessment", details: err.message });
  }
});

// Export router for use in Express app
export default router;

// To use this router, ensure your main app includes:
// import vitalsRouter from './routes/vitals.js';
// app.use('/vitals', vitalsRouter);