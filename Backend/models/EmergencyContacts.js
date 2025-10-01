import express from "express";
import EmergencyContact from "../models/EmergencyContact.js"; // adjust path if needed

const router = express.Router();

// Save contact to MongoDB
router.post("/contacts", async (req, res) => {
  const { name, phone, relationship, userId } = req.body;

  if (!name || !phone || !relationship) {
    return res.status(400).json({ error: "All fields are required" });
  }

  try {
    const contact = new EmergencyContact({ name, phone, relationship, userId });
    const saved = await contact.save();
    res.status(201).json({ message: "Contact saved", contact: saved });
  } catch (err) {
    console.error("Error saving contact:", err);
    res.status(500).json({ error: "Failed to save contact" });
  }
});

// Get all contacts from MongoDB
router.get("/contacts", async (req, res) => {
  try {
    const contacts = await EmergencyContact.find();
    res.json(contacts);
  } catch (err) {
    console.error("Error loading contacts:", err);
    res.status(500).json({ error: "Failed to load contacts" });
  }
});

export default router;