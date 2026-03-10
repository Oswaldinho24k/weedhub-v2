import mongoose from "mongoose";

declare global {
  var __mongoose: {
    conn: typeof mongoose | null;
    promise: Promise<typeof mongoose> | null;
  };
}

if (!global.__mongoose) {
  global.__mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  const MONGODB_URI = process.env.MONGODB_URI;

  if (!MONGODB_URI) {
    throw new Error("MONGODB_URI environment variable is not defined");
  }

  if (global.__mongoose.conn) {
    return global.__mongoose.conn;
  }

  if (!global.__mongoose.promise) {
    global.__mongoose.promise = mongoose.connect(MONGODB_URI, {
      bufferCommands: false,
    });
  }

  try {
    global.__mongoose.conn = await global.__mongoose.promise;
  } catch (e) {
    global.__mongoose.promise = null;
    throw e;
  }

  return global.__mongoose.conn;
}
