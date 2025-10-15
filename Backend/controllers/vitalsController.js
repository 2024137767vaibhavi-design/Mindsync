export const getVitals = async (req, res) => {
  try {
    const vitals = {
      heartRate: "72 bpm",
      stressLevel: "38%",
      sleepHours: "7.5 hrs",
      bp: "118 / 76",
      ecg: "420 ms",
      temperature: "36.8 °C",
      energy: "65%"
    };
    res.json(vitals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};