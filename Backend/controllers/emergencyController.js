import EmergencyLog from "../models/EmergencyLog.js";

export const logEmergency = async (req, res) => {
  try {
    const log = new EmergencyLog(req.body);
    await log.save();
    res.status(201).json(log);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

export const getLogs = async (req, res) => {
  try {
    const logs = await EmergencyLog.find().sort({ timestamp: -1 });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};