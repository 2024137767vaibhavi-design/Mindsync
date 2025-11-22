import mongoose from "mongoose";

const EmergencyLogSchema = new mongoose.Schema({
  timestamp: { type: Date, default: Date.now },
  message: String,
  location: String,
  resolved: { type: Boolean, default: false }
});

export default mongoose.model("EmergencyLog", EmergencyLogSchema);