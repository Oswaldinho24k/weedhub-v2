import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { strains } from "./strains.js";

// Load .env manually since we don't have dotenv
const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/weedhub";

async function seed() {
  console.log("🌿 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) {
    throw new Error("Failed to get database reference");
  }

  console.log("🗑️  Clearing existing data...");
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
  }

  // Transform seed data to match Mongoose schema
  const transformed = strains.map((s: any) => ({
    name: s.name,
    slug: s.slug,
    type: s.type,
    description: s.description,
    genetics: s.genetics || {},
    cannabinoidProfile: {
      thc: { min: s.cannabinoidProfile.thcMin || 0, max: s.cannabinoidProfile.thcMax || 0 },
      cbd: { min: s.cannabinoidProfile.cbdMin || 0, max: s.cannabinoidProfile.cbdMax || 0 },
    },
    terpenes: s.terpenes || [],
    effects: s.effects || [],
    flavors: s.flavors || [],
    imageUrl: s.imageUrl,
    averageRatings: {
      overall: 0,
      potency: 0,
      flavor: 0,
      aroma: 0,
      appearance: 0,
      effects: 0,
    },
    reviewCount: 0,
    reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    isArchived: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  console.log(`🌱 Inserting ${transformed.length} strains...`);
  await db.collection("strains").insertMany(transformed);

  console.log("✅ Seed complete!");
  console.log(`   - ${transformed.length} strains inserted`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
