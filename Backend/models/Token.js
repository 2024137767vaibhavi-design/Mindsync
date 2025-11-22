import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  expiryDate: { type: Date },
});

const Token = mongoose.model("Token", tokenSchema);

export default Token;