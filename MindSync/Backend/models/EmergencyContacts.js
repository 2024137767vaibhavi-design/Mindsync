import mongoose from "mongoose";

const EmergencyContactSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    relationship: { type: String, required: true, trim: true },
    userId: { type: String, trim: true }
  },
  { timestamps: true }
);

export default mongoose.model("EmergencyContact", EmergencyContactSchema);