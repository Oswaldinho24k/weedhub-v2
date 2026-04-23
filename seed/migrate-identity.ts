import fs from "fs";
import path from "path";
import mongoose from "mongoose";

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
    if (!process.env[key]) process.env[key] = value;
  }
}

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/weedhub";
const DRY = process.argv.includes("--dry-run");

const ADJECTIVES = [
  "Tranquilo", "Serena", "Curioso", "Valiente", "Silente", "Calma",
  "Viva", "Sagaz", "Noble", "Astuto", "Plácida", "Rauda",
  "Audaz", "Mística", "Lúcida", "Sobria", "Aguda", "Fluida",
];
const CREATURES = [
  "Jaguar", "Ceiba", "Quetzal", "Totem", "Nopal", "Puma",
  "Guacamaya", "Ocelote", "Tucán", "Iguana", "Maguey", "Colibrí",
];

function rand<T>(a: readonly T[]): T {
  return a[Math.floor(Math.random() * a.length)];
}
function fourDigit() {
  return String(Math.floor(Math.random() * 9000) + 1000);
}
function slugify(raw: string) {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9_]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 20);
}

async function uniqueAnonHandle(db: any) {
  for (let i = 0; i < 8; i++) {
    const c = `${rand(ADJECTIVES)}-${rand(CREATURES)}-${fourDigit()}`;
    const exists = await db.collection("users").findOne({ anonymousHandle: c });
    if (!exists) return c;
  }
  return `${rand(ADJECTIVES)}-${rand(CREATURES)}-${fourDigit()}-${Date.now().toString(36).slice(-4)}`;
}

async function uniqueUsername(db: any, base: string) {
  const seed = slugify(base) || "usuario";
  if (seed.length < 3) return `${seed}_${Date.now().toString(36).slice(-4)}`;
  let candidate = seed;
  let n = 0;
  while (await db.collection("users").findOne({ username: candidate })) {
    n++;
    const suffix = String(n);
    candidate = `${seed.slice(0, 20 - suffix.length - 1)}_${suffix}`;
    if (n > 50) {
      return `${seed.slice(0, 14)}_${Date.now().toString(36).slice(-4)}`;
    }
  }
  return candidate;
}

async function run() {
  console.log(DRY ? "🔍 DRY RUN · no escribe cambios" : "🔧 Migrando identidades...");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No DB");

  let userUpdates = 0;
  const users = await db.collection("users").find().toArray();
  for (const u of users) {
    const set: Record<string, any> = {};
    if (!u.username) {
      set.username = await uniqueUsername(
        db,
        u.displayName || (u.email ? String(u.email).split("@")[0] : "usuario")
      );
    }
    if (!u.anonymousHandle) {
      set.anonymousHandle = await uniqueAnonHandle(db);
    }
    if (u.publishAsAnonymous === undefined || u.publishAsAnonymous === null) {
      set.publishAsAnonymous = true;
    }
    if (!u.country) set.country = "MX";
    if (u.showCityPublicly === undefined || u.showCityPublicly === null) {
      set.showCityPublicly = false;
    }

    if (Object.keys(set).length > 0) {
      userUpdates++;
      if (DRY) {
        console.log(`  [user ${u._id}] ← ${JSON.stringify(set)}`);
      } else {
        await db.collection("users").updateOne({ _id: u._id }, { $set: set });
      }
    }
  }

  let reviewUpdates = 0;
  const reviewsMissing = await db
    .collection("reviews")
    .updateMany(
      { publishedAs: { $exists: false } },
      { $set: { publishedAs: "anonymous" } }
    );
  reviewUpdates = reviewsMissing.modifiedCount || 0;
  if (DRY) {
    const count = await db
      .collection("reviews")
      .countDocuments({ publishedAs: { $exists: false } });
    console.log(`  [reviews] ${count} reseñas recibirían publishedAs="anonymous"`);
  }

  console.log(
    `✅ Listo. Users actualizados: ${userUpdates}. Reviews actualizadas: ${reviewUpdates}.`
  );

  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ Migration failed:", err);
  process.exit(1);
});
