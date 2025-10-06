import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";
import googleFitRoutes from "./routes/googleFit.js";

// Route imports
import journalRoutes from "./routes/journal.js";
import chatbotRoutes from "./routes/chatbot.js";
import emergencyRoutes from "./routes/emergency.js";
import vitalsRoutes from "./routes/vitals.js";

// Load env from Backend/.env; if not found, also try parent project's .env
dotenv.config();
if (!process.env.OPENAI_API_KEY || !process.env.MONGO_URI) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}

// Minimal masked diagnostics to confirm env loading (does not print secrets)
const mask = (val) => (val ? `${val.length} chars, ends ${val.slice(-4)}` : "missing");
console.log(
  "ENV check:",
  {
    OPENAI_API_KEY: mask(process.env.OPENAI_API_KEY || ""),
    OPENAI_KEY: mask(process.env.OPENAI_KEY || ""),
    OPENAI: mask(process.env.OPENAI || ""),
    API_KEY: mask(process.env.API_KEY || ""),
    MONGO_URI: process.env.MONGO_URI ? "present" : "missing"
  }
);

const app = express();
app.use(cors());
app.use(express.json());

connectDB();

app.use("/api/journal", journalRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/vitals", vitalsRoutes);
app.use("/api/google-fit", googleFitRoutes);

app.get("/ping", (req, res) => {
  res.send("✅ Server is alive");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Server running on http://localhost:${PORT}`));
