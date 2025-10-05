import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Route imports
import journalRoutes from "./routes/journal.js";
import chatbotRoutes from "./routes/chatbot.js";
import emergencyRoutes from "./routes/emergency.js";
import vitalsRoutes from "./routes/vitals.js";

// Load env
dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
if (!process.env.OPENAI_API_KEY || !process.env.MONGO_URI) {
  dotenv.config({ path: path.resolve(__dirname, "../.env") });
}

// Minimal masked diagnostics to confirm env loading
const mask = (val) => (val ? `${val.length} chars, ends ${val.slice(-4)}` : "missing");
console.log(
  "ENV check:",
  {
    OPENAI_API_KEY: mask(process.env.OPENAI_API_KEY || ""),
    MONGO_URI: process.env.MONGO_URI ? "present" : "missing"
  }
);

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// API routes
app.use("/api/journal", journalRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/vitals", vitalsRoutes);

// Serve frontend
app.use(express.static(path.join(__dirname, "public")));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public/index.html"));
});

// Ping route
app.get("/ping", (req, res) => {
  res.send("✅ Server is alive");
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));
