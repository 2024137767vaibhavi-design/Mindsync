import mongoose from "mongoose";

const testMongoConnection = async () => {
  const uri = "mongodb+srv://mindsync:vikasbharati@mindsync.j1pttxz.mongodb.net/mindsync";

  try {
    console.log("🔄 Attempting to connect to MongoDB...");
    const connection = await mongoose.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
    console.log("✅ Successfully connected to MongoDB");

    const dbStats = await connection.connection.db.command({ dbStats: 1 });
    console.log("📊 Database Stats:", dbStats);

    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  } catch (error) {
    console.error("❌ MongoDB connection error:", error.message);
  }
};

testMongoConnection();