// utils/db.js
const mongoose = require("mongoose");
const ShortUrl = require("../models/shortUrls");

let cached = global.mongoose;
if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
  if (cached.conn) return cached.conn;

  if (!cached.promise) {
    cached.promise = mongoose.connect(process.env.MONGO_URI, {
      bufferCommands: false,
      serverSelectionTimeoutMS: 5000,
    });
  }

  cached.conn = await cached.promise;

  // Seed once
  const count = await ShortUrl.countDocuments();
  if (count === 0) {
    await ShortUrl.create({ full: "https://youtu.be/dQw4w9WgXcQ" });
  }

  return cached.conn;
}

module.exports = dbConnect;
