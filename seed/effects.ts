/**
 * Seed the unified effects catalog.
 * Safe to run multiple times — upserts by key.
 *
 * Usage: npx tsx seed/effects.ts
 */

import fs from "fs";
import path from "path";
import mongoose from "mongoose";

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

const EFFECTS_CATALOG = [
  // ── Positive ──────────────────────────────────────────────
  { key: "relaxed",     labelEn: "Relaxed",      labelEs: "Relajación",        labelPt: "Relaxado",      category: "positive" },
  { key: "euphoric",    labelEn: "Euphoric",      labelEs: "Euforia",           labelPt: "Eufórico",      category: "positive" },
  { key: "happy",       labelEn: "Happy",         labelEs: "Felicidad",         labelPt: "Feliz",         category: "positive" },
  { key: "creative",    labelEn: "Creative",      labelEs: "Creatividad",       labelPt: "Criativo",      category: "positive" },
  { key: "energetic",   labelEn: "Energetic",     labelEs: "Energía",           labelPt: "Energético",    category: "positive" },
  { key: "focused",     labelEn: "Focused",       labelEs: "Concentración",     labelPt: "Focado",        category: "positive" },
  { key: "pain-relief", labelEn: "Pain Relief",   labelEs: "Alivio del dolor",  labelPt: "Alívio da dor", category: "positive" },
  { key: "anti-anxiety",labelEn: "Anti-anxiety",  labelEs: "Anti-ansiedad",     labelPt: "Ansiolítico",   category: "positive" },
  { key: "hungry",      labelEn: "Hungry",        labelEs: "Apetito",           labelPt: "Apetite",       category: "positive" },
  { key: "sleepy",      labelEn: "Sleepy",        labelEs: "Sueño",             labelPt: "Sono",          category: "positive" },
  { key: "talkative",   labelEn: "Talkative",     labelEs: "Sociabilidad",      labelPt: "Sociável",      category: "positive" },
  { key: "calm",        labelEn: "Calm",          labelEs: "Calma",             labelPt: "Calmo",         category: "positive" },
  { key: "meditative",  labelEn: "Meditative",    labelEs: "Meditativo",        labelPt: "Meditativo",    category: "positive" },
  { key: "motivated",   labelEn: "Motivated",     labelEs: "Motivación",        labelPt: "Motivado",      category: "positive" },
  { key: "giggly",      labelEn: "Giggly",        labelEs: "Risas",             labelPt: "Risadas",       category: "positive" },
  { key: "uplifted",    labelEn: "Uplifted",      labelEs: "Ánimo",             labelPt: "Animado",       category: "positive" },
  { key: "tingly",      labelEn: "Tingly",        labelEs: "Hormigueo",         labelPt: "Formigamento",  category: "positive" },
  { key: "wellbeing",   labelEn: "Wellbeing",     labelEs: "Bienestar",         labelPt: "Bem-estar",     category: "positive" },
  { key: "aroused",     labelEn: "Aroused",       labelEs: "Excitación",        labelPt: "Excitado",      category: "positive" },
  // ── Negative (side effects — review form only) ────────────
  { key: "dry-mouth",   labelEn: "Dry Mouth",     labelEs: "Boca seca",         labelPt: "Boca seca",     category: "negative" },
  { key: "red-eyes",    labelEn: "Red Eyes",      labelEs: "Ojos rojos",        labelPt: "Olhos vermelhos", category: "negative" },
  { key: "dizzy",       labelEn: "Dizzy",         labelEs: "Mareo",             labelPt: "Tontura",       category: "negative" },
  { key: "paranoia",    labelEn: "Paranoia",      labelEs: "Paranoia",          labelPt: "Paranoia",      category: "negative" },
  { key: "anxiety",     labelEn: "Anxiety",       labelEs: "Ansiedad",          labelPt: "Ansiedade",     category: "negative" },
] as const;

async function main() {
  console.log("🌿 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  const col = mongoose.connection.db!.collection("effects");

  const ops = EFFECTS_CATALOG.map((e) => ({
    updateOne: {
      filter: { key: e.key },
      update: {
        $set: { ...e, status: "approved", source: "system" },
        $setOnInsert: { usageCount: 0, createdAt: new Date() },
      },
      upsert: true,
    },
  }));

  const res = await col.bulkWrite(ops, { ordered: false });
  console.log(`✅ Effects seeded — ${res.upsertedCount} inserted, ${res.modifiedCount} updated`);
  await mongoose.disconnect();
}

main().catch((err) => { console.error("❌", err); process.exit(1); });
