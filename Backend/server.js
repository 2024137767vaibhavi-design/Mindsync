import express from "express";
import cors from "cors";
import dotenv from "dotenv";
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

connectDB();

app.use("/api/journal", journalRoutes);
app.use("/api/chatbot", chatbotRoutes);
app.use("/api/emergency", emergencyRoutes);
app.use("/api/vitals", vitalsRoutes);

app.get("/ping", (req, res) => {
  res.send("✅ Server is alive");
});

app.listen(5000, () => console.log("🌐 Server running on http://localhost:5000"));