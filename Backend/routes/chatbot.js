import express from "express";
import OpenAI from "openai";
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
    const apiKey =
      process.env.OPENAI_API_KEY ||
      process.env.OPENAI_KEY ||
      process.env.OPENAI ||
      process.env.API_KEY;
    if (!apiKey) {
      // Local fallback when API key is missing: generate a supportive reply without calling OpenAI
      const friendly = {
        positive: [
          "That's wonderful to hear! What helped you feel this way today?",
          "Love that energy—want to build a routine that keeps it going?"
        ],
        neutral: [
          "Thanks for sharing. What would make today 10% better?",
          "I'm here—want to unpack what’s on your mind a bit?"
        ],
        negative: [
          "I’m sorry it’s tough right now. One small step: try 4-7-8 breathing with me.",
          "You’re not alone. Want to journal a few lines together?"
        ]
      }[mood];

      const reply = friendly[Math.floor(Math.random() * friendly.length)];
      return res.json({ reply, note: "Local fallback reply (no OpenAI key set)" });
    }

    const openai = new OpenAI({ apiKey });
    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ]
    });

    const reply = completion.choices?.[0]?.message?.content?.trim() || "";
    res.json({ reply });
  } catch (err) {
    const description = err?.response?.data || err?.message || String(err);
    console.error("OpenAI error:", description);
    res.status(500).json({
      error: "Failed to get response from OpenAI",
      details: description
    });
  }
});


export default router;