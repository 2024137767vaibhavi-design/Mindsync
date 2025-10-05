import express from "express";
import axios from "axios";
import Sentiment from "sentiment";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();
const sentiment = new Sentiment();

router.post("/", async (req, res) => {
  const userMessage = req.body.message;
  if (!userMessage) {
    return res.status(400).json({ error: "Missing message in request body" });
  }

  const result = sentiment.analyze(userMessage);
  const mood = result.score > 2 ? "positive" : result.score < -2 ? "negative" : "neutral";

  const systemPrompt = {
    positive: "You are MindCare, a joyful and encouraging mental health companion. Celebrate progress and offer uplifting support.",
    neutral: "You are MindCare, a calm and thoughtful mental health companion. Offer clarity and gentle guidance.",
    negative: "You are MindCare, a gentle and emotionally aware mental health companion. Respond with empathy, reassurance, and warmth."
  }[mood];

  try {
    const response = await axios.post(
  "https://api.groq.com/openai/v1/chat/completions",
  {
    model: "openai/gpt-oss-20b",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage }
    ]
  },
  {
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json"
    }
  }
);

    const reply = response.data.choices[0].message.content;
    res.json({ reply });
  } catch (err) {
    console.error("Groq Claude error:", err.response?.data || err.message || err);
    res.status(500).json({
      error: "Failed to get response from Claude via Groq",
      details: err.response?.data || err.message || "Unknown error"
    });
  }
});


export default router;