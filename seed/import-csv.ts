/**
 * Import strains from a Leafly-format CSV.
 * Skips slugs already in the DB — reviews and users are never touched.
 *
 * Usage:
 *   npx tsx seed/import-csv.ts /path/to/cannabis.csv
 *   npx tsx seed/import-csv.ts              ← defaults to seed/data/cannabis.csv
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envPath = path.resolve(process.cwd(), ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const t = line.trim();
    if (!t || t.startsWith("#")) continue;
    const eq = t.indexOf("=");
    if (eq === -1) continue;
    const k = t.slice(0, eq);
    if (!process.env[k]) process.env[k] = t.slice(eq + 1);
  }
}

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/weedhub";

// ── Helpers ──────────────────────────────────────────────────────────────────

const COLOR_PALETTE = ["#6aa56a", "#b57b4a", "#a47ab5", "#d9a843", "#5fa8c2", "#c25f8a"];
const TYPE_BLEND: Record<string, string> = {
  sativa: "Sativa dominante",
  indica: "Indica dominante",
  hybrid: "Híbrida balanceada",
};
const MOMENTO: Record<string, { manana: number; tarde: number; noche: number }> = {
  sativa: { manana: 50, tarde: 35, noche: 15 },
  hybrid: { manana: 30, tarde: 40, noche: 30 },
  indica: { manana: 10, tarde: 35, noche: 55 },
};

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}
function colorHint(slug: string) {
  return COLOR_PALETTE[hashCode(slug) % COLOR_PALETTE.length];
}
function difficulty(thcMax: number): "Baja" | "Moderada" | "Alta" {
  if (thcMax < 18) return "Baja";
  if (thcMax <= 24) return "Moderada";
  return "Alta";
}
function timeCurve(type: string) {
  const presets: Record<string, { cerebral: number[]; calm: number[]; energy: number[] }> = {
    sativa:  { cerebral: [0,70,90,80,50,25], calm: [0,20,35,45,40,25], energy: [0,60,80,65,40,15] },
    hybrid:  { cerebral: [0,50,75,85,60,30], calm: [0,30,50,70,65,40], energy: [0,40,55,55,35,15] },
    indica:  { cerebral: [0,35,55,65,55,35], calm: [0,40,70,90,85,60], energy: [0,25,35,35,25,10] },
  };
  const p = presets[type] || presets.hybrid;
  return ["0 min","15 min","30 min","1 h","2 h","3 h"].map((label, i) => ({
    t: String([0,15,30,60,120,180][i]), label,
    energy: p.energy[i], calm: p.calm[i], cerebral: p.cerebral[i],
  }));
}

function slugify(raw: string): string {
  return raw.toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function titleCase(hyphenated: string): string {
  return hyphenated.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// Minimal CSV parser — handles quoted fields with embedded commas.
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let cur = "";
  let inQuote = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      inQuote = !inQuote;
    } else if (ch === "," && !inQuote) {
      fields.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  fields.push(cur);
  return fields;
}

// ── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  const csvPath = process.argv[2] || path.join(__dirname, "data", "cannabis.csv");

  if (!fs.existsSync(csvPath)) {
    console.error(`❌  File not found: ${csvPath}`);
    process.exit(1);
  }

  console.log(`📄 Reading ${csvPath}...`);
  const lines = fs.readFileSync(csvPath, "utf-8").split("\n");
  // header: Strain,Type,Rating,Effects,Flavor,Description
  const rows = lines.slice(1).filter((l) => l.trim());

  console.log("🌿 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.db!.collection("strains");

  // Fetch all existing slugs in one query
  const existing = new Set<string>(await col.distinct("slug"));
  console.log(`📊 ${existing.size} strains already in DB`);

  const now = new Date();
  const ops: any[] = [];
  let skipped = 0;

  for (const line of rows) {
    const [strainRaw, typeRaw, , effectsRaw, flavorRaw, description] = parseCSVLine(line);
    if (!strainRaw) continue;

    const slug = slugify(strainRaw);
    if (!slug) continue;
    if (existing.has(slug)) { skipped++; continue; }

    const type = (typeRaw || "hybrid").toLowerCase();
    const effects = effectsRaw ? effectsRaw.split(",").map((e) => e.trim()).filter(Boolean) : [];
    const flavors = flavorRaw ? flavorRaw.split(",").map((f) => f.trim()).filter(Boolean) : [];
    const thcMax = 20; // CSV has no cannabinoid data — use sensible default

    ops.push({
      updateOne: {
        filter: { slug },
        update: {
          $set: {
            name: titleCase(strainRaw),
            type,
            typeBlend: TYPE_BLEND[type] || TYPE_BLEND.hybrid,
            description: description?.trim() || "",
            descriptionEs: description?.trim() || "",
            lineage: undefined,
            genetics: {},
            cannabinoidProfile: { thc: { min: 15, max: thcMax }, cbd: { min: 0, max: 1 } },
            terpenes: [],
            dominantTerpene: undefined,
            effects,
            flavors,
            difficulty: difficulty(thcMax),
            timeCurve: timeCurve(type),
            momento: MOMENTO[type] || MOMENTO.hybrid,
            colorHint: colorHint(slug),
            imageUrl: undefined,
            isArchived: false,
            updatedAt: now,
          },
          $setOnInsert: {
            slug,
            aliases: [],
            aliasSlugs: [],
            averageRatings: { overall: 0, potency: 0, flavor: 0, aroma: 0, appearance: 0, effects: 0 },
            reviewCount: 0,
            reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
            createdAt: now,
          },
        },
        upsert: true,
      },
    });
  }

  if (ops.length === 0) {
    console.log("✅ Nothing new to import — all strains already exist.");
    await mongoose.disconnect();
    return;
  }

  console.log(`➕ ${ops.length} new strains to import (${skipped} already existed, skipping)`);

  const CHUNK = 500;
  let inserted = 0;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const res = await col.bulkWrite(ops.slice(i, i + CHUNK), { ordered: false });
    inserted += res.upsertedCount || 0;
  }

  console.log(`✅ Done! ${inserted} inserted, reviews/users untouched.`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
