/**
 * Reverse-lookup genetics seed.
 * For each strain with parent1/parent2, finds those parents by name
 * and adds the child slug to their genetics.children[] array.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Manual .env loading
const envPath = path.resolve(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf-8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    const val = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = val;
  }
}

import mongoose from "mongoose";
import { StrainModel } from "../app/models/strain.server.js";

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error("MONGODB_URI not set");
  await mongoose.connect(uri);
  console.log("Connected to MongoDB");

  // Fetch all strains that have at least one parent
  const strainsWithParents = await StrainModel.find({
    $or: [
      { "genetics.parent1": { $exists: true, $ne: "" } },
      { "genetics.parent2": { $exists: true, $ne: "" } },
    ],
  }).lean();

  console.log(`Found ${strainsWithParents.length} strains with parent data`);

  // Build name→slug lookup map (case-insensitive)
  const allStrains = await StrainModel.find({}).select("name slug").lean();
  const nameToSlug = new Map<string, string>();
  for (const s of allStrains) {
    nameToSlug.set(s.name.toLowerCase().trim(), s.slug);
  }

  // Clear all existing children arrays first
  await StrainModel.updateMany({}, { $set: { "genetics.children": [] } });
  console.log("Cleared existing genetics.children arrays");

  let updated = 0;
  let notFound = 0;

  for (const strain of strainsWithParents) {
    const parents = [strain.genetics?.parent1, strain.genetics?.parent2].filter(Boolean) as string[];

    for (const parentName of parents) {
      const parentSlug = nameToSlug.get(parentName.toLowerCase().trim());
      if (!parentSlug) {
        notFound++;
        continue;
      }
      await StrainModel.updateOne(
        { slug: parentSlug },
        { $addToSet: { "genetics.children": strain.slug } }
      );
      updated++;
    }
  }

  console.log(`Updated ${updated} parent→child links`);
  console.log(`Could not find ${notFound} parent strains by name`);

  // Report top parents (most children)
  const topParents = await StrainModel.find({
    "genetics.children.0": { $exists: true },
  })
    .select("name slug genetics.children")
    .sort({ "genetics.children": -1 })
    .limit(10)
    .lean();

  console.log("\nTop parent strains:");
  for (const p of topParents) {
    console.log(`  ${p.name} (${p.slug}): ${p.genetics?.children?.length} children`);
  }

  await mongoose.disconnect();
  console.log("\nDone!");
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
