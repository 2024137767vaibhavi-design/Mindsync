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

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Connect database
connectDB();

// Routes
app.use("/api/journal", journalRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/vitals", vitalsRoutes);

// Serve frontend
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, "../public")));

app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public/index.html"));
});

// Health check route
app.get("/ping", (req, res) => {
  res.send("✅ Server is alive");
});

// Use environment variable PORT if provided by Render
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🌐 Server running on http://localhost:${PORT}`));
