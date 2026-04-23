import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

const strains: any[] = JSON.parse(
  fs.readFileSync(path.join(__dirname, "data", "strains.json"), "utf-8")
);

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
// aliases are well-known alternate names users may type; dedup matches against these.
const HERO_OVERRIDES: Record<string, Partial<any>> = {
  "blue-dream": {
    descriptionEs:
      "Un clásico californiano: la relajación corporal del Blueberry con la euforia cerebral del Haze. Ideal para el día — mantiene claridad mental y cuerpo suelto.",
    lineage: "Blueberry × Haze",
    typeBlend: "60% Sativa",
    aliases: ["BD", "Azure Haze"],
  },
  "og-kush": {
    descriptionEs:
      "La raíz de incontables variedades modernas. Cuerpo pesado, aroma a combustible y pino, con un colocón que se instala por horas.",
    lineage: "Chemdawg × Hindu Kush",
    typeBlend: "Indica-dom",
    aliases: ["OG", "Original Kush", "Original Gangster Kush"],
  },
  gelato: {
    descriptionEs:
      "Postre líquido: dulce, cremoso, con punzadas cítricas. Híbrida balanceada que relaja sin apagarte.",
    lineage: "Sunset Sherbet × Thin Mint GSC",
    typeBlend: "Híbrida balanceada",
    aliases: ["Larry Bird", "Gelato 33", "Gelato #33"],
  },
  "jack-herer": {
    descriptionEs:
      "Nombre en honor al activista. Euforia limpia y social, aroma a pino y especia. La sativa de cabecera para crear.",
    lineage: "Haze × (Northern Lights #5 × Shiva Skunk)",
    typeBlend: "55% Sativa",
    aliases: ["JH", "Premium Jack", "Platinum Jack"],
  },
  "purple-punch": {
    descriptionEs:
      "Postre de uva y arándano. Golpe frontal a la cabeza y luego descanso profundo. Para cerrar el día.",
    lineage: "Larry OG × Granddaddy Purple",
    typeBlend: "Indica-dom",
    aliases: ["PP"],
  },
  "acapulco-gold": {
    descriptionEs:
      "La landrace mexicana que definió una era. Euforia dorada, ligera, con notas terrosas y dulces. Patrimonio vivo.",
    lineage: "Landrace mexicana",
    typeBlend: "Sativa pura",
    aliases: ["Acapulco Oro", "Mexican Gold", "Oro de Acapulco"],
  },
  "girl-scout-cookies": {
    descriptionEs:
      "La híbrida californiana que redefinió el dulce en el cannabis. Dulce, terrosa, con un colocón cerebral denso.",
    lineage: "OG Kush × Durban Poison",
    typeBlend: "Indica-dom",
    aliases: ["GSC", "Cookies", "Girl Scout", "Forum Cookies"],
  },
  "gorilla-glue-4": {
    descriptionEs:
      "Híbrida pegajosa como su nombre. Colocón pesado, aroma a diésel y pino. Ícono moderno.",
    lineage: "Chem's Sister × Sour Dubb × Chocolate Diesel",
    typeBlend: "Híbrida balanceada",
    aliases: ["GG4", "Gorilla Glue", "Original Glue", "420 Glue"],
  },
};

function slugifyAlias(raw: string): string {
  return raw
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

async function seed() {
  console.log("🌿 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);

  const db = mongoose.connection.db;
  if (!db) throw new Error("Failed to get database reference");

  console.log("♻️  Upserting strains by slug (preserving _ids, users, reviews, submissions)...");
  const strainsCol = db.collection("strains");
  const now = new Date();

  let inserted = 0;
  let updated = 0;

  const ops = strains.map((s: any) => {
    const thcMin = s.cannabinoidProfile?.thc?.min ?? s.cannabinoidProfile?.thcMin ?? 0;
    const thcMax = s.cannabinoidProfile?.thc?.max ?? s.cannabinoidProfile?.thcMax ?? 0;
    const cbdMin = s.cannabinoidProfile?.cbd?.min ?? s.cannabinoidProfile?.cbdMin ?? 0;
    const cbdMax = s.cannabinoidProfile?.cbd?.max ?? s.cannabinoidProfile?.cbdMax ?? 0;
    const thc = { min: thcMin, max: thcMax };
    const cbd = { min: cbdMin, max: cbdMax };
    const override = HERO_OVERRIDES[s.slug] || {};
    const aliases: string[] = override.aliases || [];

    const set = {
      name: s.name,
      aliases,
      aliasSlugs: aliases.map(slugifyAlias),
      type: s.type,
      typeBlend: override.typeBlend || TYPE_BLEND[s.type],
      description: s.description,
      descriptionEs: override.descriptionEs || s.description,
      lineage: override.lineage || s.lineage || (s.genetics?.parent1 && s.genetics?.parent2 ? `${s.genetics.parent1} × ${s.genetics.parent2}` : undefined),
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
      isArchived: false,
      updatedAt: now,
    };

    // Only seed rating/review fields on INSERT; never overwrite values maintained
    // by real reviews (review.server.ts updates these via aggregation triggers).
    const setOnInsert = {
      slug: s.slug,
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
      createdAt: now,
    };

    return {
      updateOne: {
        filter: { slug: s.slug },
        update: { $set: set, $setOnInsert: setOnInsert },
        upsert: true,
      },
    };
  });

  // bulkWrite in chunks to avoid huge single ops
  const CHUNK = 500;
  for (let i = 0; i < ops.length; i += CHUNK) {
    const res = await strainsCol.bulkWrite(ops.slice(i, i + CHUNK), { ordered: false });
    inserted += res.upsertedCount || 0;
    updated += res.modifiedCount || 0;
  }

  console.log("✅ Seed complete!");
  console.log(`   - ${strains.length} strains processed`);
  console.log(`   - ${inserted} inserted (new), ${updated} updated (existing _ids preserved)`);
  console.log(`   - users, reviews, saved-strains, strain-submissions untouched`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
