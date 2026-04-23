import { connectDB } from "~/lib/db.server";
import { ReviewModel } from "~/models/review.server";
import { StrainModel } from "~/models/strain.server";
import { UserModel } from "~/models/user.server";

export async function recalculateStrainRatings(strainId: string) {
  await connectDB();

  const result = await ReviewModel.aggregate([
    { $match: { strainId: strainId, status: "published" } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgOverall: { $avg: "$ratings.overall" },
        avgPotency: { $avg: "$ratings.potency" },
        avgFlavor: { $avg: "$ratings.flavor" },
        avgAroma: { $avg: "$ratings.aroma" },
        avgAppearance: { $avg: "$ratings.appearance" },
        avgEffects: { $avg: "$ratings.effects" },
      },
    },
  ]);

  // Calculate distribution
  const distResult = await ReviewModel.aggregate([
    { $match: { strainId: strainId, status: "published" } },
    {
      $group: {
        _id: "$ratings.overall",
        count: { $sum: 1 },
      },
    },
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of distResult) {
    const rounded = Math.round(d._id);
    if (rounded >= 1 && rounded <= 5) {
      distribution[rounded] = d.count;
    }
  }

  if (result.length > 0) {
    const r = result[0];
    await StrainModel.findByIdAndUpdate(strainId, {
      averageRatings: {
        overall: Math.round(r.avgOverall * 10) / 10,
        potency: Math.round(r.avgPotency * 10) / 10,
        flavor: Math.round(r.avgFlavor * 10) / 10,
        aroma: Math.round(r.avgAroma * 10) / 10,
        appearance: Math.round(r.avgAppearance * 10) / 10,
        effects: Math.round(r.avgEffects * 10) / 10,
      },
      reviewCount: r.count,
      reviewDistribution: distribution,
      lastReviewedAt: new Date(),
    });
  } else {
    await StrainModel.findByIdAndUpdate(strainId, {
      averageRatings: { overall: 0, potency: 0, flavor: 0, aroma: 0, appearance: 0, effects: 0 },
      reviewCount: 0,
      reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  }
}

export async function updateUserStats(userId: string) {
  await connectDB();

  const [reviewCount, strainsReviewed, helpfulResult] = await Promise.all([
    ReviewModel.countDocuments({ userId, status: "published" }),
    ReviewModel.distinct("strainId", { userId, status: "published" }).then((r) => r.length),
    ReviewModel.aggregate([
      { $match: { userId: userId, status: "published" } },
      { $group: { _id: null, total: { $sum: "$helpfulCount" } } },
    ]),
  ]);

  const helpfulVotesReceived = helpfulResult[0]?.total || 0;

  await UserModel.findByIdAndUpdate(userId, {
    "stats.reviewCount": reviewCount,
    "stats.strainsReviewed": strainsReviewed,
    "stats.helpfulVotesReceived": helpfulVotesReceived,
  });
}
