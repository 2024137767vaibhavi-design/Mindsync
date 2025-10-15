import mongoose from "mongoose";
import JournalEntry from "./models/JournalEntry.js";

const seedDatabase = async () => {
  const uri = "mongodb+srv://mindsync:vikasbharati@mindsync.j1pttxz.mongodb.net/mindsync";

  try {
    console.log("🔄 Connecting to MongoDB...");
    await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ Connected to MongoDB");

    const sampleEntries = [
      { title: "First Entry", content: "This is the first journal entry.", date: new Date() },
      { title: "Second Entry", content: "This is the second journal entry.", date: new Date() },
    ];

    await JournalEntry.insertMany(sampleEntries);
    console.log("✅ Sample journal entries added to the database");

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ Error seeding the database:", error.message);
  }
};

seedDatabase();