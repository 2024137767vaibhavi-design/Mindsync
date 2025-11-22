import mongoose from "mongoose";

const VitalSchema = new mongoose.Schema({
  heartRate: String,
  stressLevel: String,
  sleepHours: String,
  bp: String,
  ecg: String,
  temperature: String,
  energy: String,
  timestamp: { type: Date, default: Date.now }
});

export default mongoose.model("Vital", VitalSchema);