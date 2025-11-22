import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import connectDB from "./config/db.js";

// Import routes
import chatbotRoutes from "./routes/chatbot.js";
import journalRoutes from "./routes/journal.js";
import vitalsRoutes from "./routes/vitals.js";
import emergencyRoutes from "./routes/emergency.js";
import googleFitRoutes from "./routes/googleFit.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to MongoDB
connectDB();

// API routes
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/journal", journalRoutes);
app.use("/api/vitals", vitalsRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/googlefit", googleFitRoutes);

// Serve frontend from ../public
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicPath = path.join(__dirname, "../public");
if (fs.existsSync(publicPath)) {
  app.use(express.static(publicPath));
  app.get("*", (req, res) => res.sendFile(path.join(publicPath, "index.html")));
}

// Health check
app.get("/ping", (req, res) => res.send("✅ Server is alive and running!"));

// --- Safe automatic port fallback ---
const PORT = parseInt(process.env.PORT, 10) || 5000;

function startServer(port) {
  const server = app.listen(port, () => {
    console.log(`🚀 MindSync backend running at http://localhost:${port}`);
  });

  server.on("error", (err) => {
    if (err.code === "EADDRINUSE") {
      const nextPort = port + 1;
      console.log(`⚠️ Port ${port} in use. Trying ${nextPort}...`);
      startServer(nextPort); // retry with numeric addition
    } else {
      console.error("❌ Server failed to start:", err);
    }
  });
}

startServer(PORT);
