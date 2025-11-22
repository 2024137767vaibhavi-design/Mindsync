import JournalEntry from "../models/JournalEntry.js";
import { isDbConnected } from "../config/db.js";

export const createEntry = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const newEntry = new JournalEntry(req.body);
    const saved = await newEntry.save();
    res.status(201).json(saved);
  } catch (err) {
    console.error("❌ Error saving journal entry:", err);
    res.status(500).json({ error: "Failed to save journal entry" });
  }
};

export const getEntries = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const entries = await JournalEntry.find().sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    console.error("❌ Error fetching journal entries:", err);
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
};

export const deleteEntry = async (req, res) => {
  if (!isDbConnected()) {
    return res.status(503).json({ error: "Database not connected" });
  }
  try {
    const { id } = req.params;
    const deletedEntry = await JournalEntry.findByIdAndDelete(id);
    
    if (!deletedEntry) {
      return res.status(404).json({ error: "Journal entry not found" });
    }
    
    res.json({ message: "Journal entry deleted successfully", deletedEntry });
  } catch (err) {
    console.error("❌ Error deleting journal entry:", err);
    res.status(500).json({ error: "Failed to delete journal entry" });
  }
};
