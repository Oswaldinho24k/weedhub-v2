/**
 * fill-pexels-images.ts
 *
 * Fetches cannabis images from Pexels and stores them in strains that have no imageUrl.
 * Uses a pool of ~200 varied images to avoid 870 individual API calls.
 *
 * Usage:
 *   npx tsx scripts/fill-pexels-images.ts              # fill all strains without imageUrl
 *   npx tsx scripts/fill-pexels-images.ts --dry-run    # preview only, no DB writes
 *   npx tsx scripts/fill-pexels-images.ts --limit=50   # only first 50 strains
 */
import mongoose from "mongoose";

const PEXELS_API_KEY = process.env.PEXELS_API_KEY;
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/weedhub";
const DRY_RUN = process.argv.includes("--dry-run");
const LIMIT = (() => {
  const l = process.argv.find((a) => a.startsWith("--limit="));
  return l ? parseInt(l.split("=")[1], 10) : undefined;
})();

if (!PEXELS_API_KEY) {
  console.error("Missing PEXELS_API_KEY in env");
  process.exit(1);
}

// Cannabis-specific search queries — Pexels has real cannabis photos under "cannabis"
const SEARCH_QUERIES = [
  "cannabis",
  "cannabis bud",
  "cannabis macro",
  "marijuana bud",
  "cannabis trichomes",
  "cannabis flower",
  "cannabis kush",
  "cannabis plant",
  "weed bud",
  "cannabis indica",
];

async function pexelsSearch(query: string, page = 1): Promise<string[]> {
  const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=20&page=${page}&orientation=square`;
  const res = await fetch(url, {
    headers: { Authorization: PEXELS_API_KEY! },
  });
  if (!res.ok) {
    console.warn(`Pexels API error for "${query}": ${res.status}`);
    return [];
  }
  const data = (await res.json()) as { photos: { src: { large: string; medium: string } }[] };
  return data.photos.map((p) => p.src.large || p.src.medium);
}

async function buildImagePool(): Promise<string[]> {
  console.log("Building image pool from Pexels...");
  const pool: string[] = [];
  for (const query of SEARCH_QUERIES) {
    const urls = await pexelsSearch(query);
    pool.push(...urls);
    process.stdout.write(`  "${query}" → ${urls.length} images (pool: ${pool.length})\n`);
    // Small delay to be polite to the API
    await new Promise((r) => setTimeout(r, 300));
  }
  // Deduplicate
  const unique = [...new Set(pool)];
  console.log(`Pool ready: ${unique.length} unique images.\n`);
  return unique;
}

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB\n");

  const db = mongoose.connection.db!;
  const strainsCol = db.collection("strains");

  const query = { isArchived: { $ne: true }, $or: [{ imageUrl: { $exists: false } }, { imageUrl: null }, { imageUrl: "" }] };
  const total = await strainsCol.countDocuments(query);
  const toProcess = LIMIT ? Math.min(total, LIMIT) : total;
  console.log(`Strains without imageUrl: ${total}${LIMIT ? ` (processing first ${LIMIT})` : ""}\n`);

  if (toProcess === 0) {
    console.log("Nothing to do — all strains already have images.");
    await mongoose.disconnect();
    return;
  }

  const imagePool = await buildImagePool();
  if (imagePool.length === 0) {
    console.error("No images fetched from Pexels. Aborting.");
    await mongoose.disconnect();
    process.exit(1);
  }

  const strains = await strainsCol
    .find(query, { projection: { _id: 1, slug: 1, name: 1 } })
    .limit(toProcess)
    .toArray();

  let updated = 0;
  for (let i = 0; i < strains.length; i++) {
    const strain = strains[i];
    // Cycle through the pool so all strains get an image
    const imageUrl = imagePool[i % imagePool.length];

    if (DRY_RUN) {
      console.log(`[DRY] ${strain.slug} → ${imageUrl}`);
    } else {
      await strainsCol.updateOne({ _id: strain._id }, { $set: { imageUrl } });
      updated++;
      if (updated % 50 === 0) {
        console.log(`  ${updated}/${strains.length} updated...`);
      }
    }
  }

  if (DRY_RUN) {
    console.log(`\n[DRY RUN] Would have updated ${strains.length} strains.`);
  } else {
    console.log(`\nDone. Updated ${updated} strains with Pexels images.`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  mongoose.disconnect();
  process.exit(1);
});
