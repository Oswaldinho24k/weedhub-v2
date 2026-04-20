import fs from "fs";
import path from "path";
import mongoose from "mongoose";
import { strains } from "./strains.js";

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

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/weedhub";

const COLOR_PALETTE = [
  "#6aa56a",
  "#b57b4a",
  "#a47ab5",
  "#d9a843",
  "#5fa8c2",
  "#c25f8a",
];

const TYPE_BLEND: Record<string, string> = {
  sativa: "Sativa dominante",
  indica: "Indica dominante",
  hybrid: "Híbrida balanceada",
};

const MOMENTO_BY_TYPE: Record<string, { manana: number; tarde: number; noche: number }> = {
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

function dominantTerpene(terpenes: Array<{ name: string; percentage: number }>) {
  if (!terpenes?.length) return undefined;
  return [...terpenes].sort((a, b) => b.percentage - a.percentage)[0].name;
}

function timeCurve(type: string) {
  // Six points: 0, 15, 30, 60, 120, 180 min
  // Sativa peaks earlier/cerebral; indica peaks later/calm; hybrid in between.
  const labels = ["0 min", "15 min", "30 min", "1 h", "2 h", "3 h"];
  const presets = {
    sativa: {
      cerebral: [0, 70, 90, 80, 50, 25],
      calm: [0, 20, 35, 45, 40, 25],
      energy: [0, 60, 80, 65, 40, 15],
    },
    hybrid: {
      cerebral: [0, 50, 75, 85, 60, 30],
      calm: [0, 30, 50, 70, 65, 40],
      energy: [0, 40, 55, 55, 35, 15],
    },
    indica: {
      cerebral: [0, 35, 55, 65, 55, 35],
      calm: [0, 40, 70, 90, 85, 60],
      energy: [0, 25, 35, 35, 25, 10],
    },
  } as const;
  const p = (presets as any)[type] || presets.hybrid;
  return labels.map((label, i) => ({
    t: String([0, 15, 30, 60, 120, 180][i]),
    label,
    energy: p.energy[i],
    calm: p.calm[i],
    cerebral: p.cerebral[i],
  }));
}

// Curated Spanish descriptions + overrides for hero strains shown in the design.
const HERO_OVERRIDES: Record<string, Partial<any>> = {
  "blue-dream": {
    descriptionEs:
      "Un clásico californiano: la relajación corporal del Blueberry con la euforia cerebral del Haze. Ideal para el día — mantiene claridad mental y cuerpo suelto.",
    lineage: "Blueberry × Haze",
    typeBlend: "60% Sativa",
  },
  "og-kush": {
    descriptionEs:
      "La raíz de incontables variedades modernas. Cuerpo pesado, aroma a combustible y pino, con un colocón que se instala por horas.",
    lineage: "Chemdawg × Hindu Kush",
    typeBlend: "Indica-dom",
  },
  gelato: {
    descriptionEs:
      "Postre líquido: dulce, cremoso, con punzadas cítricas. Híbrida balanceada que relaja sin apagarte.",
    lineage: "Sunset Sherbet × Thin Mint GSC",
    typeBlend: "Híbrida balanceada",
  },
  "jack-herer": {
    descriptionEs:
      "Nombre en honor al activista. Euforia limpia y social, aroma a pino y especia. La sativa de cabecera para crear.",
    lineage: "Haze × (Northern Lights #5 × Shiva Skunk)",
    typeBlend: "55% Sativa",
  },
  "purple-punch": {
    descriptionEs:
      "Postre de uva y arándano. Golpe frontal a la cabeza y luego descanso profundo. Para cerrar el día.",
    lineage: "Larry OG × Granddaddy Purple",
    typeBlend: "Indica-dom",
  },
  "acapulco-gold": {
    descriptionEs:
      "La landrace mexicana que definió una era. Euforia dorada, ligera, con notas terrosas y dulces. Patrimonio vivo.",
    lineage: "Landrace mexicana",
    typeBlend: "Sativa pura",
  },
};

async function seed() {
  console.log("🌿 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) throw new Error("Failed to get database reference");

  console.log("🗑️  Clearing existing data...");
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    await db.dropCollection(col.name);
  }

  const transformed = strains.map((s: any) => {
    const thc = {
      min: s.cannabinoidProfile.thcMin || 0,
      max: s.cannabinoidProfile.thcMax || 0,
    };
    const cbd = {
      min: s.cannabinoidProfile.cbdMin || 0,
      max: s.cannabinoidProfile.cbdMax || 0,
    };
    const lineage =
      s.genetics?.parent1 && s.genetics?.parent2
        ? `${s.genetics.parent1} × ${s.genetics.parent2}`
        : undefined;
    const override = HERO_OVERRIDES[s.slug] || {};

    return {
      name: s.name,
      slug: s.slug,
      type: s.type,
      typeBlend: override.typeBlend || TYPE_BLEND[s.type],
      description: s.description,
      descriptionEs: override.descriptionEs || s.description,
      lineage: override.lineage || lineage,
      genetics: s.genetics || {},
      cannabinoidProfile: { thc, cbd },
      terpenes: s.terpenes || [],
      dominantTerpene: dominantTerpene(s.terpenes || []),
      effects: s.effects || [],
      flavors: s.flavors || [],
      difficulty: difficulty(thc.max),
      timeCurve: timeCurve(s.type),
      momento: MOMENTO_BY_TYPE[s.type] || MOMENTO_BY_TYPE.hybrid,
      colorHint: colorHint(s.slug),
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
    };
  });

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
