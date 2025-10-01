import JournalEntry from "../models/JournalEntry.js";

export const createEntry = async (req, res) => {
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
  try {
    const entries = await JournalEntry.find().sort({ date: -1 });
    res.json(entries);
  } catch (err) {
    console.error("❌ Error fetching journal entries:", err);
    res.status(500).json({ error: "Failed to fetch journal entries" });
  }
};

export const deleteEntry = async (req, res) => {
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
