/**
 * Hide (not delete) all seed content from the public site.
 *  - Marks seed documents with source: "seed" (the app's hideSeed plugin filters them out).
 *  - Snapshots each strain's community aggregates into `seedSnapshot` and resets them,
 *    so ratings/counts on the site only reflect real reviews.
 *
 *   node --env-file .env seed/hide-seed.mjs            # hide
 *   node --env-file .env seed/hide-seed.mjs --restore  # put everything back as it was
 */
import mongoose from "mongoose";

await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
const db = mongoose.connection.db;
const C = (n) => db.collection(n);
const restore = process.argv.includes("--restore");

// The original seed was inserted on 2026-04-20 (seed/seed-full.ts); the content seed carries seedBatch.
const apr20 = { $gte: new Date("2026-04-20T00:00:00Z"), $lt: new Date("2026-04-21T00:00:00Z") };
const oidRange = {
  $gte: mongoose.Types.ObjectId.createFromTime(apr20.$gte.getTime() / 1000),
  $lt: mongoose.Types.ObjectId.createFromTime(apr20.$lt.getTime() / 1000),
};
const SEED_MATCH = { $or: [{ _id: oidRange }, { seedBatch: { $exists: true } }] };
const COLLECTIONS = ["reviews", "users", "posts", "comments", "quickratings", "savedstrains", "brands", "products", "dispensaries"];

if (restore) {
  for (const n of COLLECTIONS) {
    const r = await C(n).updateMany({ source: "seed" }, { $unset: { source: "" } });
    console.log(`${n}: unmarked ${r.modifiedCount}`);
  }
  const strains = C("strains").find({ seedSnapshot: { $exists: true } });
  let n = 0;
  for await (const s of strains) {
    await C("strains").updateOne({ _id: s._id }, { $set: { ...s.seedSnapshot }, $unset: { seedSnapshot: "" } });
    n++;
  }
  console.log(`strains restored: ${n}`);
  await mongoose.disconnect();
  process.exit(0);
}

for (const n of COLLECTIONS) {
  const match = n === "users" ? { ...SEED_MATCH, isQaAccount: { $ne: true }, role: { $ne: "admin" } } : SEED_MATCH;
  const r = await C(n).updateMany(match, { $set: { source: "seed" } });
  console.log(`${n}: marked ${r.modifiedCount}`);
}

// Snapshot + reset strain aggregates that came from seed reviews.
const strains = C("strains").find({ seedSnapshot: { $exists: false } }).project({ averageRatings: 1, reviewCount: 1, reviewDistribution: 1, conditionVotes: 1, helpsWithConditions: 1 });
let snap = 0;
for await (const s of strains) {
  const real = await C("reviews").countDocuments({ strainId: s._id, source: { $ne: "seed" }, status: "published" });
  if (real > 0) continue; // keep strains that already have real reviews untouched
  await C("strains").updateOne(
    { _id: s._id },
    {
      $set: {
        seedSnapshot: {
          averageRatings: s.averageRatings ?? {},
          reviewCount: s.reviewCount ?? 0,
          reviewDistribution: s.reviewDistribution ?? {},
          conditionVotes: s.conditionVotes ?? {},
          helpsWithConditions: s.helpsWithConditions ?? [],
        },
        averageRatings: { overall: 0, potency: 0, flavor: 0, aroma: 0, appearance: 0, effects: 0 },
        reviewCount: 0,
        reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
        conditionVotes: {},
        helpsWithConditions: [],
      },
    }
  );
  snap++;
}
console.log(`strains snapshotted + reset: ${snap}`);
const visible = await C("reviews").countDocuments({ source: { $ne: "seed" } });
console.log(`reviews still public: ${visible}`);
await mongoose.disconnect();
