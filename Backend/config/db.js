import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

function sanitize(str) {
  if (!str) return "";
  return String(str).trim().replace(/^"|"$/g, "");
}

function isValidMongoUri(uri) {
  if (!uri) return false;
  const u = sanitize(uri);
  return u.startsWith("mongodb://") || u.startsWith("mongodb+srv://");
}

function buildMongoUriFromParts() {
  const user = sanitize(process.env.MONGO_USER);
  const passRaw = sanitize(process.env.MONGO_PASS);
  const host = sanitize(process.env.MONGO_HOST); // e.g. cluster0.jgpeljx.mongodb.net
  const db = sanitize(process.env.MONGO_DB) || "mindsync";
  if (!user || !passRaw || !host) return "";
  const pass = encodeURIComponent(passRaw);
  const params = "retryWrites=true&w=majority" + (process.env.MONGO_APPNAME ? `&appName=${encodeURIComponent(sanitize(process.env.MONGO_APPNAME))}` : "");
  return `mongodb+srv://${user}:${pass}@${host}/${db}?${params}`;
}

const connectDB = async () => {
  try {
    const rawUri = sanitize(process.env.MONGO_URI);
    const candidateUri = isValidMongoUri(rawUri) ? rawUri : buildMongoUriFromParts();
    const fallbackUri = "mongodb://localhost:27017/mindsync";

    const mongoUri = candidateUri || fallbackUri;

    const mask = (val) => (val ? `${val.length} chars, ends ${val.slice(-4)}` : "missing");
    console.log("Mongo config:", {
      using: isValidMongoUri(rawUri) ? "MONGO_URI" : candidateUri ? "MONGO_* parts" : "fallback localhost",
      hostHint: mongoUri.replace(/^(mongodb\+srv:\/\/|mongodb:\/\/)/, "").split("/")[0],
      user: sanitize(process.env.MONGO_USER) || "(from URI)",
      pass: process.env.MONGO_PASS ? mask(process.env.MONGO_PASS) : "(from URI)",
      db: sanitize(process.env.MONGO_DB) || "(from URI or default)"
    });

    await mongoose.connect(mongoUri);
    console.log("✅ MongoDB Connected");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    console.log("⚠️ Server will continue without database connection");
    // Don't exit the process, let the server run without DB
  }
};

export const isDbConnected = () => mongoose.connection.readyState === 1;

export default connectDB;