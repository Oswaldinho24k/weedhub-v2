/**
 * WeedHub Full Seed — 870 strains, 200 users, ~1500 reviews
 *
 * Usage:
 *   npx tsx seed/seed-full.ts
 *
 * WARNING: This drops ALL existing data before seeding.
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import mongoose from "mongoose";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ── Load .env ────────────────────────────────────────────────
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

// ── Helpers (same as original seed) ──────────────────────────

const COLOR_PALETTE = [
  "#6aa56a", "#b57b4a", "#a47ab5", "#d9a843", "#5fa8c2", "#c25f8a",
];

const TYPE_BLEND: Record<string, string> = {
  sativa: "Sativa dominante",
  indica: "Indica dominante",
  hybrid: "Híbrida balanceada",
};

const MOMENTO_BY_TYPE: Record<
  string,
  { manana: number; tarde: number; noche: number }
> = {
  sativa: { manana: 50, tarde: 35, noche: 15 },
  hybrid: { manana: 30, tarde: 40, noche: 30 },
  indica: { manana: 10, tarde: 35, noche: 55 },
};

function hashCode(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++)
    h = ((h << 5) - h + s.charCodeAt(i)) | 0;
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

function dominantTerpene(
  terpenes: Array<{ name: string; percentage: number }>
) {
  if (!terpenes?.length) return undefined;
  return [...terpenes].sort((a, b) => b.percentage - a.percentage)[0].name;
}

function timeCurve(type: string) {
  const labels = ["0 min", "15 min", "30 min", "1 h", "2 h", "3 h"];
  const presets: Record<
    string,
    { cerebral: number[]; calm: number[]; energy: number[] }
  > = {
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
  };
  const p = presets[type] || presets.hybrid;
  return labels.map((label, i) => ({
    t: String([0, 15, 30, 60, 120, 180][i]),
    label,
    energy: p.energy[i],
    calm: p.calm[i],
    cerebral: p.cerebral[i],
  }));
}

const HERO_OVERRIDES: Record<string, { descriptionEs?: string; lineage?: string; typeBlend?: string }> = {
  "blue-dream": {
    descriptionEs: "Un clásico californiano: la relajación corporal del Blueberry con la euforia cerebral del Haze. Ideal para el día — mantiene claridad mental y cuerpo suelto.",
    lineage: "Blueberry × Haze",
    typeBlend: "60% Sativa",
  },
  "og-kush": {
    descriptionEs: "La raíz de incontables variedades modernas. Cuerpo pesado, aroma a combustible y pino, con un colocón que se instala por horas.",
    lineage: "Chemdawg × Hindu Kush",
    typeBlend: "Indica-dom",
  },
  gelato: {
    descriptionEs: "Postre líquido: dulce, cremoso, con punzadas cítricas. Híbrida balanceada que relaja sin apagarte.",
    lineage: "Sunset Sherbet × Thin Mint GSC",
    typeBlend: "Híbrida balanceada",
  },
  "jack-herer": {
    descriptionEs: "Nombre en honor al activista. Euforia limpia y social, aroma a pino y especia. La sativa de cabecera para crear.",
    lineage: "Haze × (Northern Lights #5 × Shiva Skunk)",
    typeBlend: "55% Sativa",
  },
  "purple-punch": {
    descriptionEs: "Postre de uva y arándano. Golpe frontal a la cabeza y luego descanso profundo. Para cerrar el día.",
    lineage: "Larry OG × Granddaddy Purple",
    typeBlend: "Indica-dom",
  },
  "acapulco-gold": {
    descriptionEs: "La landrace mexicana que definió una era. Euforia dorada, ligera, con notas terrosas y dulces. Patrimonio vivo.",
    lineage: "Landrace mexicana",
    typeBlend: "Sativa pura",
  },
};

// ── Main seed function ───────────────────────────────────────

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

  // ── Load JSON data ──
  const dataDir = path.resolve(__dirname, "data");
  const strainsRaw = JSON.parse(
    fs.readFileSync(path.join(dataDir, "strains.json"), "utf-8")
  );
  const usersRaw = JSON.parse(
    fs.readFileSync(path.join(dataDir, "users.json"), "utf-8")
  );
  const reviewsRaw = JSON.parse(
    fs.readFileSync(path.join(dataDir, "reviews.json"), "utf-8")
  );

  // ── 1. Insert Strains ──
  console.log(`🌱 Inserting ${strainsRaw.length} strains...`);
  const now = new Date();

  const transformedStrains = strainsRaw.map((s: any) => {
    const thcMin = s.cannabinoidProfile?.thc?.min ?? s.cannabinoidProfile?.thcMin ?? 0;
    const thcMax = s.cannabinoidProfile?.thc?.max ?? s.cannabinoidProfile?.thcMax ?? 0;
    const cbdMin = s.cannabinoidProfile?.cbd?.min ?? s.cannabinoidProfile?.cbdMin ?? 0;
    const cbdMax = s.cannabinoidProfile?.cbd?.max ?? s.cannabinoidProfile?.cbdMax ?? 0;

    const override = HERO_OVERRIDES[s.slug] || {};

    return {
      name: s.name,
      slug: s.slug,
      type: s.type,
      typeBlend: override.typeBlend || TYPE_BLEND[s.type],
      description: s.description || s.name,
      descriptionEs: override.descriptionEs || s.descriptionEs || s.description || "",
      lineage: override.lineage || s.lineage || "",
      genetics: s.genetics || {},
      cannabinoidProfile: {
        thc: { min: thcMin, max: thcMax },
        cbd: { min: cbdMin, max: cbdMax },
      },
      terpenes: s.terpenes || [],
      dominantTerpene: dominantTerpene(s.terpenes || []),
      effects: s.effects || [],
      flavors: s.flavors || [],
      difficulty: difficulty(thcMax),
      timeCurve: timeCurve(s.type),
      momento: MOMENTO_BY_TYPE[s.type] || MOMENTO_BY_TYPE.hybrid,
      colorHint: colorHint(s.slug),
      imageUrl: s.imageUrl || undefined,
      averageRatings: s.averageRatings || { overall: 0, potency: 0, flavor: 0, aroma: 0, appearance: 0, effects: 0 },
      reviewCount: s.reviewCount || 0,
      reviewDistribution: s.reviewDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
      isArchived: false,
      createdAt: now,
      updatedAt: now,
    };
  });

  const strainResult = await db
    .collection("strains")
    .insertMany(transformedStrains);
  const strainIds = Object.values(strainResult.insertedIds);
  console.log(`   ✅ ${strainIds.length} strains inserted`);

  // ── 2. Insert Users ──
  console.log(`👤 Inserting ${usersRaw.length} users...`);

  const transformedUsers = usersRaw.map((u: any) => ({
    email: u.email,
    passwordHash: u.passwordHash,
    username: u.username,
    anonymousHandle: u.anonymousHandle,
    publishAsAnonymous: u.publishAsAnonymous,
    displayName: u.displayName,
    avatar: undefined,
    role: u.role || "user",
    country: u.country || "MX",
    city: u.city || undefined,
    showCityPublicly: u.showCityPublicly || false,
    birthYear: u.birthYear || undefined,
    acquisitionSource: u.acquisitionSource || undefined,
    cannabisProfile: u.cannabisProfile || {
      experienceLevel: "principiante",
      preferredEffects: [],
      preferredMethods: [],
      preferredTime: [],
      thcPreference: "any",
      cbdPreference: "any",
    },
    stats: {
      reviewCount: u.stats?.reviewCount || 0,
      helpfulVotesReceived: u.stats?.helpfulVotesReceived || 0,
      strainsReviewed: u.stats?.strainsReviewed || 0,
      joinedAt: u.stats?.joinedAt ? new Date(u.stats.joinedAt) : now,
    },
    earnedBadges: (u.earnedBadges || []).map((b: any) => ({
      badgeId: b.badgeId,
      earnedAt: b.earnedAt ? new Date(b.earnedAt) : now,
    })),
    points: u.points || 0,
    onboardingCompleted: u.onboardingCompleted ?? true,
    createdAt: u.stats?.joinedAt ? new Date(u.stats.joinedAt) : now,
    updatedAt: now,
  }));

  const userResult = await db
    .collection("users")
    .insertMany(transformedUsers);
  const userIds = Object.values(userResult.insertedIds);
  console.log(`   ✅ ${userIds.length} users inserted`);

  // ── 3. Insert Reviews ──
  console.log(`📝 Inserting ${reviewsRaw.length} reviews...`);

  const transformedReviews = reviewsRaw.map((r: any) => {
    const userId = userIds[r.userIndex];
    const strainId = strainIds[r.strainIndex];

    // Resolve helpful vote indices to ObjectIds
    const helpfulVotes = (r.helpfulVoteIndices || []).map(
      (idx: number) => userIds[idx]
    );

    return {
      userId,
      strainId,
      ratings: r.ratings,
      comment: r.comment || "",
      context: r.context || { method: "", timeOfDay: "", setting: "" },
      effectsExperienced: r.effectsExperienced || [],
      helpfulVotes,
      helpfulCount: helpfulVotes.length,
      status: r.status || "published",
      publishedAs: r.publishedAs || "anonymous",
      createdAt: r.createdAt ? new Date(r.createdAt) : now,
      updatedAt: now,
    };
  });

  // Insert in batches to avoid memory issues
  const BATCH_SIZE = 500;
  let inserted = 0;
  for (let i = 0; i < transformedReviews.length; i += BATCH_SIZE) {
    const batch = transformedReviews.slice(i, i + BATCH_SIZE);
    await db.collection("reviews").insertMany(batch);
    inserted += batch.length;
    console.log(`   ... ${inserted}/${transformedReviews.length} reviews`);
  }
  console.log(`   ✅ ${inserted} reviews inserted`);

  // ── 4. Create indexes ──
  console.log("📇 Creating indexes...");
  await db.collection("strains").createIndex({ slug: 1 }, { unique: true });
  await db.collection("strains").createIndex({ type: 1 });
  await db.collection("strains").createIndex({ "averageRatings.overall": -1 });
  await db.collection("strains").createIndex({ reviewCount: -1 });
  await db.collection("strains").createIndex(
    { name: "text", description: "text" },
    { weights: { name: 10, description: 1 } }
  );
  await db.collection("users").createIndex({ email: 1 }, { unique: true });
  await db.collection("users").createIndex({ username: 1 }, { unique: true });
  await db.collection("users").createIndex({ anonymousHandle: 1 }, { unique: true });
  await db.collection("users").createIndex({ country: 1 });
  await db.collection("reviews").createIndex({ strainId: 1, createdAt: -1 });
  await db.collection("reviews").createIndex(
    { userId: 1, strainId: 1 },
    { unique: true }
  );
  await db.collection("reviews").createIndex({ userId: 1, createdAt: -1 });
  await db.collection("reviews").createIndex({ status: 1 });
  await db.collection("reviews").createIndex({ publishedAs: 1 });

  console.log("\n✅ Full seed complete!");
  console.log(`   🌱 ${strainIds.length} strains`);
  console.log(`   👤 ${userIds.length} users`);
  console.log(`   📝 ${inserted} reviews`);

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
