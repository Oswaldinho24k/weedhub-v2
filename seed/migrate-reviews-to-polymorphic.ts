/**
 * Migration: backfill entityType="strain" and entityId=strainId on all legacy reviews.
 * Safe to run multiple times (only updates docs where entityType is missing).
 */
import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/weedhub";

async function main() {
  await mongoose.connect(MONGODB_URI);
  console.log("Connected to MongoDB");

  const result = await mongoose.connection.db
    ?.collection("reviews")
    .updateMany(
      { entityType: { $exists: false }, strainId: { $exists: true } },
      [
        {
          $set: {
            entityType: "strain",
            entityId: "$strainId",
            reviewType: "community",
            isSponsored: false,
          },
        },
      ]
    );

  const modified = result?.modifiedCount ?? 0;
  console.log(`✓ Migrated ${modified} reviews → entityType="strain", entityId=strainId`);

  // Verify
  const remaining = await mongoose.connection.db
    ?.collection("reviews")
    .countDocuments({ entityType: { $exists: false } });
  console.log(`  Remaining without entityType: ${remaining}`);

  await mongoose.disconnect();
  console.log("Done.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
