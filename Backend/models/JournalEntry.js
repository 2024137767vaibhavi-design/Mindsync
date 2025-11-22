import mongoose from "mongoose";

const JournalEntrySchema = new mongoose.Schema(
  {
    title: { type: String, default: "(Untitled)", trim: true },
    date: { type: String, required: true },
    mood: { type: String, default: "😐" },
    content: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.model("JournalEntry", JournalEntrySchema);
