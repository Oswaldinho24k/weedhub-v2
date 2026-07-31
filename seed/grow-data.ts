import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Manual .env loading
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("MONGODB_URI not set");
  process.exit(1);
}

type Climate = "tropical" | "mediterráneo" | "continental" | "frío";

interface GrowEntry {
  slug: string;
  difficulty: "Baja" | "Moderada" | "Alta";
  grow: {
    floweringWeeks: { min: number; max: number };
    yieldIndoor: string;
    yieldOutdoor: string;
    heightCm: { min: number; max: number };
    climate: Climate;
    isAutoflowering: boolean;
    isFeminized: boolean;
  };
}

const GROW_DATA: GrowEntry[] = [
  {
    slug: "blue-dream",
    difficulty: "Baja",
    grow: { floweringWeeks: { min: 9, max: 10 }, yieldIndoor: "500-600 g/m²", yieldOutdoor: "700 g/planta", heightCm: { min: 120, max: 180 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "og-kush",
    difficulty: "Alta",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "400-500 g/m²", yieldOutdoor: "500 g/planta", heightCm: { min: 90, max: 130 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "white-widow",
    difficulty: "Baja",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "450-500 g/m²", yieldOutdoor: "600 g/planta", heightCm: { min: 80, max: 120 }, climate: "continental", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "northern-lights",
    difficulty: "Baja",
    grow: { floweringWeeks: { min: 7, max: 9 }, yieldIndoor: "500-600 g/m²", yieldOutdoor: "625 g/planta", heightCm: { min: 100, max: 160 }, climate: "continental", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "gorilla-glue-4",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "500-600 g/m²", yieldOutdoor: "700 g/planta", heightCm: { min: 100, max: 150 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "gelato",
    difficulty: "Alta",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "400-500 g/m²", yieldOutdoor: "500 g/planta", heightCm: { min: 100, max: 130 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "sour-diesel",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 10, max: 11 }, yieldIndoor: "450-500 g/m²", yieldOutdoor: "600 g/planta", heightCm: { min: 120, max: 180 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "granddaddy-purple",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 8, max: 11 }, yieldIndoor: "400-500 g/m²", yieldOutdoor: "600 g/planta", heightCm: { min: 90, max: 150 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "gg4",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "500-600 g/m²", yieldOutdoor: "700 g/planta", heightCm: { min: 100, max: 150 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "jack-herer",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 8, max: 10 }, yieldIndoor: "400-500 g/m²", yieldOutdoor: "600 g/planta", heightCm: { min: 100, max: 180 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "pineapple-express",
    difficulty: "Baja",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "450-550 g/m²", yieldOutdoor: "500 g/planta", heightCm: { min: 100, max: 150 }, climate: "tropical", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "amnesia-haze",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 10, max: 12 }, yieldIndoor: "600-700 g/m²", yieldOutdoor: "650 g/planta", heightCm: { min: 130, max: 200 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "girl-scout-cookies",
    difficulty: "Alta",
    grow: { floweringWeeks: { min: 9, max: 10 }, yieldIndoor: "400-500 g/m²", yieldOutdoor: "450 g/planta", heightCm: { min: 90, max: 130 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "ak-47",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "350-500 g/m²", yieldOutdoor: "500 g/planta", heightCm: { min: 100, max: 150 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "zkittlez",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "450-550 g/m²", yieldOutdoor: "600 g/planta", heightCm: { min: 90, max: 130 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "wedding-cake",
    difficulty: "Alta",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "450-550 g/m²", yieldOutdoor: "550 g/planta", heightCm: { min: 100, max: 140 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "super-silver-haze",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 9, max: 11 }, yieldIndoor: "500-600 g/m²", yieldOutdoor: "800 g/planta", heightCm: { min: 150, max: 220 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "purple-punch",
    difficulty: "Baja",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "400-500 g/m²", yieldOutdoor: "500 g/planta", heightCm: { min: 90, max: 120 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "do-si-dos",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "400-450 g/m²", yieldOutdoor: "500 g/planta", heightCm: { min: 90, max: 130 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "trainwreck",
    difficulty: "Moderada",
    grow: { floweringWeeks: { min: 8, max: 10 }, yieldIndoor: "500 g/m²", yieldOutdoor: "700 g/planta", heightCm: { min: 120, max: 200 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "strawberry-cough",
    difficulty: "Baja",
    grow: { floweringWeeks: { min: 9, max: 10 }, yieldIndoor: "450 g/m²", yieldOutdoor: "500 g/planta", heightCm: { min: 100, max: 150 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "bubba-kush",
    difficulty: "Baja",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "400 g/m²", yieldOutdoor: "450 g/planta", heightCm: { min: 80, max: 120 }, climate: "continental", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "lemon-haze",
    difficulty: "Baja",
    grow: { floweringWeeks: { min: 9, max: 10 }, yieldIndoor: "500-600 g/m²", yieldOutdoor: "700 g/planta", heightCm: { min: 130, max: 180 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "chemdawg",
    difficulty: "Alta",
    grow: { floweringWeeks: { min: 9, max: 10 }, yieldIndoor: "400-500 g/m²", yieldOutdoor: "600 g/planta", heightCm: { min: 100, max: 150 }, climate: "mediterráneo", isAutoflowering: false, isFeminized: true },
  },
  {
    slug: "durban-poison",
    difficulty: "Baja",
    grow: { floweringWeeks: { min: 8, max: 9 }, yieldIndoor: "400-500 g/m²", yieldOutdoor: "500 g/planta", heightCm: { min: 120, max: 180 }, climate: "tropical", isAutoflowering: false, isFeminized: true },
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB");

  const StrainSchema = new mongoose.Schema({}, { strict: false });
  const Strain = mongoose.models.Strain || mongoose.model("Strain", StrainSchema);

  let updated = 0;
  let notFound = 0;

  for (const entry of GROW_DATA) {
    const result = await Strain.findOneAndUpdate(
      { slug: entry.slug },
      { $set: { difficulty: entry.difficulty, grow: entry.grow } },
      { new: true }
    ).select("name slug");

    if (result) {
      console.log(`✓ ${result.name} (${entry.slug})`);
      updated++;
    } else {
      console.log(`✗ Not found: ${entry.slug}`);
      notFound++;
    }
  }

  console.log(`\nDone: ${updated} updated, ${notFound} not found`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
