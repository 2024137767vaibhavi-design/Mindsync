import { fileURLToPath } from "url";

// Required for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js"; // your existing DB connection
import journalRoutes from "./routes/journal.js";
import chatbotRoutes from "./routes/chatbot.js";
import path from "path";
import fs from "fs";

// Debugging dotenv loading
if (!fs.existsSync("./.env")) {
  console.error("❌ .env file not found in the expected directory");
} else {
  console.log("✅ .env file found. Attempting to load...");
}

dotenv.config({ path: path.resolve("./.env") });

console.log("ENV check:", {
  MONGO_URI: process.env.MONGO_URI || "missing",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "missing",
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || "missing",
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || "missing"
});

const app = express();
app.use(cors());
app.use(express.json());

// Connect MongoDB
connectDB();

// Routes
app.use("/api/journal", journalRoutes);
app.use("/api/chatbot", chatbotRoutes);
// Serve static files
app.use(express.static(path.join(__dirname, "..", "public")));

// Test route
app.get("/ping", (req, res) => res.send("✅ Server is alive"));
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "..", "public", "index.html"));
});
const PORT = process.env.PORT || 5001; // Changed port to 5001
app.listen(PORT, () => console.log(`🌐 Server running on port ${PORT}`));


