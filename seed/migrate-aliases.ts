import fs from "fs";
import path from "path";
import mongoose from "mongoose";

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const k = trimmed.slice(0, eq);
    const v = trimmed.slice(eq + 1);
    if (!process.env[k]) process.env[k] = v;
  }
}

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/weedhub";
const DRY = process.argv.includes("--dry-run");

function slugifyAlias(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Aliases for strains that may already exist in production DBs from older seeds.
const KNOWN_ALIASES: Record<string, string[]> = {
  "blue-dream": ["BD", "Azure Haze"],
  "og-kush": ["OG", "Original Kush", "Original Gangster Kush"],
  gelato: ["Larry Bird", "Gelato 33", "Gelato #33"],
  "jack-herer": ["JH", "Premium Jack", "Platinum Jack"],
  "purple-punch": ["PP"],
  "acapulco-gold": ["Acapulco Oro", "Mexican Gold", "Oro de Acapulco"],
  "girl-scout-cookies": ["GSC", "Cookies", "Girl Scout", "Forum Cookies"],
  "gorilla-glue-4": ["GG4", "Gorilla Glue", "Original Glue", "420 Glue"],
};

async function run() {
  console.log(DRY ? "🔍 DRY RUN — no escribe" : "🔧 Migrando aliases…");
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  if (!db) throw new Error("No DB");

  let updated = 0;
  let synced = 0;

  // 1) Seed known aliases for hero strains if missing.
  for (const [slug, aliases] of Object.entries(KNOWN_ALIASES)) {
    const strain = await db.collection("strains").findOne({ slug });
    if (!strain) continue;
    const hasAny = Array.isArray(strain.aliases) && strain.aliases.length > 0;
    if (hasAny) continue;

    const aliasSlugs = aliases.map(slugifyAlias);
    if (DRY) {
      console.log(`  [${slug}] ← ${aliases.join(", ")}`);
    } else {
      await db
        .collection("strains")
        .updateOne({ slug }, { $set: { aliases, aliasSlugs } });
    }
    updated++;
  }

  // 2) Backfill aliasSlugs for any strain that has aliases but no aliasSlugs
  //    (e.g. seed pre-pre-save-hook). Idempotent.
  const cursor = db
    .collection("strains")
    .find({ aliases: { $exists: true, $ne: [] } });
  for await (const s of cursor) {
    const expected = ((s.aliases || []) as string[]).map(slugifyAlias);
    const current = (s.aliasSlugs || []) as string[];
    const same =
      expected.length === current.length &&
      expected.every((v, i) => v === current[i]);
    if (!same) {
      if (DRY) {
        console.log(`  [${s.slug}] sync aliasSlugs → ${expected.join(", ")}`);
      } else {
        await db
          .collection("strains")
          .updateOne({ _id: s._id }, { $set: { aliasSlugs: expected } });
      }
      synced++;
    }
  }

  console.log(
    `✅ Done. Aliases aplicados: ${updated}. aliasSlugs sincronizados: ${synced}.`
  );
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("❌ migrate-aliases failed:", err);
  process.exit(1);
});
