import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, "utf-8").split("\n");
  for (const line of lines) {
    const match = line.match(/^([A-Z_]+)=(.*)$/);
    if (match) process.env[match[1]] = match[2].trim().replace(/^["']|["']$/g, "");
  }
}

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) { console.error("MONGODB_URI not set"); process.exit(1); }

interface CategoryEntry {
  key: string;
  labelEs: string;
  labelEn: string;
  labelPt: string;
  icon: string;
  sector: "consumo" | "cultivo";
  hasCannabinoidsProfile: boolean;
  sortOrder: number;
}

const CATEGORIES: CategoryEntry[] = [
  // ── Consumo ──────────────────────────────────────────────────────────────
  {
    key: "flower",
    labelEs: "Flor / Cogollos",
    labelEn: "Flower / Buds",
    labelPt: "Flor / Buds",
    icon: "leaf",
    sector: "consumo",
    hasCannabinoidsProfile: true,
    sortOrder: 1,
  },
  {
    key: "preroll",
    labelEs: "Pre-rolls",
    labelEn: "Pre-rolls",
    labelPt: "Pre-rolls",
    icon: "cigarette",
    sector: "consumo",
    hasCannabinoidsProfile: true,
    sortOrder: 2,
  },
  {
    key: "vape",
    labelEs: "Vapes y Cartuchos",
    labelEn: "Vapes & Cartridges",
    labelPt: "Vapes e Cartuchos",
    icon: "zap",
    sector: "consumo",
    hasCannabinoidsProfile: true,
    sortOrder: 3,
  },
  {
    key: "concentrate",
    labelEs: "Concentrados",
    labelEn: "Concentrates",
    labelPt: "Concentrados",
    icon: "droplets",
    sector: "consumo",
    hasCannabinoidsProfile: true,
    sortOrder: 4,
  },
  {
    key: "edible",
    labelEs: "Comestibles",
    labelEn: "Edibles",
    labelPt: "Comestíveis",
    icon: "cookie",
    sector: "consumo",
    hasCannabinoidsProfile: true,
    sortOrder: 5,
  },
  {
    key: "drink",
    labelEs: "Bebidas",
    labelEn: "Drinks",
    labelPt: "Bebidas",
    icon: "cup-soda",
    sector: "consumo",
    hasCannabinoidsProfile: true,
    sortOrder: 6,
  },
  {
    key: "tincture",
    labelEs: "Tinturas y Aceites",
    labelEn: "Tinctures & Oils",
    labelPt: "Tinturas e Óleos",
    icon: "droplet",
    sector: "consumo",
    hasCannabinoidsProfile: true,
    sortOrder: 7,
  },
  {
    key: "topical",
    labelEs: "Tópicos",
    labelEn: "Topicals",
    labelPt: "Tópicos",
    icon: "hand",
    sector: "consumo",
    hasCannabinoidsProfile: false,
    sortOrder: 8,
  },
  {
    key: "capsule",
    labelEs: "Cápsulas",
    labelEn: "Capsules",
    labelPt: "Cápsulas",
    icon: "pill",
    sector: "consumo",
    hasCannabinoidsProfile: true,
    sortOrder: 9,
  },
  {
    key: "accessory",
    labelEs: "Accesorios",
    labelEn: "Accessories",
    labelPt: "Acessórios",
    icon: "package",
    sector: "consumo",
    hasCannabinoidsProfile: false,
    sortOrder: 10,
  },

  // ── Cultivo ───────────────────────────────────────────────────────────────
  {
    key: "semilla",
    labelEs: "Semillas",
    labelEn: "Seeds",
    labelPt: "Sementes",
    icon: "sprout",
    sector: "cultivo",
    hasCannabinoidsProfile: true,
    sortOrder: 20,
  },
  {
    key: "clon",
    labelEs: "Clones / Esquejes",
    labelEn: "Clones / Cuttings",
    labelPt: "Clones / Estacas",
    icon: "git-branch",
    sector: "cultivo",
    hasCannabinoidsProfile: true,
    sortOrder: 21,
  },
  {
    key: "nutriente",
    labelEs: "Nutrientes y Fertilizantes",
    labelEn: "Nutrients & Fertilizers",
    labelPt: "Nutrientes e Fertilizantes",
    icon: "flask-conical",
    sector: "cultivo",
    hasCannabinoidsProfile: false,
    sortOrder: 22,
  },
  {
    key: "sustrato",
    labelEs: "Sustratos",
    labelEn: "Growing Media",
    labelPt: "Substratos",
    icon: "layers",
    sector: "cultivo",
    hasCannabinoidsProfile: false,
    sortOrder: 23,
  },
  {
    key: "iluminacion",
    labelEs: "Iluminación",
    labelEn: "Grow Lights",
    labelPt: "Iluminação",
    icon: "sun",
    sector: "cultivo",
    hasCannabinoidsProfile: false,
    sortOrder: 24,
  },
  {
    key: "equipo-cultivo",
    labelEs: "Equipo de Cultivo",
    labelEn: "Grow Equipment",
    labelPt: "Equipamento de Cultivo",
    icon: "tent",
    sector: "cultivo",
    hasCannabinoidsProfile: false,
    sortOrder: 25,
  },
];

async function main() {
  await mongoose.connect(MONGODB_URI!);
  console.log("Connected to MongoDB");

  const Schema = new mongoose.Schema({}, { strict: false });
  const ProductCategory =
    mongoose.models.ProductCategory || mongoose.model("ProductCategory", Schema);

  let created = 0;
  let updated = 0;

  for (const cat of CATEGORIES) {
    const result = await ProductCategory.findOneAndUpdate(
      { key: cat.key },
      { $set: cat },
      { upsert: true, new: true }
    );
    const wasNew = result.createdAt?.getTime() === result.updatedAt?.getTime();
    if (wasNew) { console.log(`✓ Created: ${cat.key}`); created++; }
    else { console.log(`↺ Updated: ${cat.key}`); updated++; }
  }

  console.log(`\nDone: ${created} created, ${updated} updated`);
  await mongoose.disconnect();
}

main().catch((e) => { console.error(e); process.exit(1); });
