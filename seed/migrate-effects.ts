/**
 * Migrate effects and flavors from Spanish labels to canonical English keys.
 * Safe to run multiple times — values already in English pass through unchanged.
 *
 * Usage: npx tsx seed/migrate-effects.ts
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

const ES_TO_EN_EFFECTS: Record<string, string> = {
  "Relajación": "Relaxed",
  "Euforia": "Euphoric",
  "Felicidad": "Happy",
  "Creatividad": "Creative",
  "Energía": "Energetic",
  "Concentración": "Focused",
  "Alivio del dolor": "Pain Relief",
  "Anti-ansiedad": "Anti-anxiety",
  "Apetito": "Hungry",
  "Sueño": "Sleepy",
  "Sociabilidad": "Talkative",
  "Calma": "Calm",
  "Meditativo": "Meditative",
  "Meditación": "Meditative",
  "Motivación": "Motivated",
  "Risas": "Giggly",
  "Ánimo": "Uplifted",
  "Hormigueo": "Tingly",
  "Bienestar": "Wellbeing",
  "Alivio muscular": "Relaxed",
  "Anti-náusea": "Anti-anxiety",
  "Excitación": "Uplifted",
};

const ES_TO_EN_FLAVORS: Record<string, string> = {
  "Terroso": "Earthy",
  "Cítrico": "Citrus",
  "Dulce": "Sweet",
  "Pino": "Pine",
  "Frutal": "Fruity",
  "Floral": "Flowery",
  "Especiado": "Spicy",
  "Herbal": "Herbal",
  "Diesel": "Diesel",
  "Uva": "Grape",
  "Menta": "Mint",
  "Queso": "Cheese",
  "Chocolate": "Chocolate",
  "Café": "Coffee",
  "Vainilla": "Vanilla",
  "Tropical": "Tropical",
  "Frutos rojos": "Berry",
  "Skunk": "Skunk",
  "Melocotón": "Fruity",
  "Violeta": "Flowery",
  "Naranja": "Citrus",
  "Madera": "Earthy",
  "Intenso": "Diesel",
  "Albaricoque": "Fruity",
  "Limón": "Citrus",
  "Lima": "Citrus",
  "Pomelo": "Citrus",
  "Arándano": "Berry",
  "Fresa": "Berry",
  "Mango": "Fruity",
  "Mentol": "Mint",
  "Salvia": "Herbal",
  "Nuez": "Earthy",
  "Amoníaco": "Earthy",
  "Químico": "Diesel",
  "Tabaco": "Earthy",
  "Té": "Herbal",
  "Rosa": "Flowery",
  "Lavanda": "Flowery",
  "Mantequilla": "Sweet",
  "Miel": "Sweet",
  "Ciruela": "Fruity",
  "Manzana": "Fruity",
  "Pera": "Fruity",
  "Pimienta": "Spicy",
  "Especia": "Spicy",
  "Alquitrán": "Diesel",
};

function migrateList(values: string[], map: Record<string, string>): string[] {
  return values.map((v) => map[v] ?? v);
}

async function main() {
  console.log("🌿 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.db!.collection("strains");

  const strains = await col.find({}, { projection: { _id: 1, effects: 1, flavors: 1 } }).toArray();
  console.log(`📊 ${strains.length} strains to migrate`);

  const ops = strains.map((s) => ({
    updateOne: {
      filter: { _id: s._id },
      update: {
        $set: {
          effects: migrateList(s.effects || [], ES_TO_EN_EFFECTS),
          flavors: migrateList(s.flavors || [], ES_TO_EN_FLAVORS),
        },
      },
    },
  }));

  const CHUNK = 500;
  let updated = 0;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const res = await col.bulkWrite(ops.slice(i, i + CHUNK), { ordered: false });
    updated += res.modifiedCount || 0;
  }

  console.log(`✅ Done — ${updated} strains updated`);
  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("❌", err);
  process.exit(1);
});
