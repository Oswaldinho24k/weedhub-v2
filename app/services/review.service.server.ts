import { connectDB } from "~/lib/db.server";
import { ReviewModel, type ReviewEntityType } from "~/models/review.server";
import { StrainModel } from "~/models/strain.server";
import { QuickRatingModel } from "~/models/quick-rating.server";
import { UserModel } from "~/models/user.server";
import mongoose from "mongoose";

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

  // Merge quick ratings into overall avg (weight 0.5× vs full review 1×)
  const quickRatings = await QuickRatingModel.find({ strainId }, { rating: 1 }).lean();
  const qSum = quickRatings.reduce((s, q) => s + q.rating, 0);
  const qCount = quickRatings.length;

  if (result.length > 0) {
    const r = result[0];
    const totalWeight = r.count * 1.0 + qCount * 0.5;
    const weightedOverall = totalWeight > 0
      ? Math.round(((r.avgOverall * r.count + qSum * 0.5) / totalWeight) * 10) / 10
      : 0;
    await StrainModel.findByIdAndUpdate(strainId, {
      averageRatings: {
        overall: weightedOverall,
        potency: Math.round(r.avgPotency * 10) / 10,
        flavor: Math.round(r.avgFlavor * 10) / 10,
        aroma: Math.round(r.avgAroma * 10) / 10,
        appearance: Math.round(r.avgAppearance * 10) / 10,
        effects: Math.round(r.avgEffects * 10) / 10,
      },
      reviewCount: r.count + qCount,
      reviewDistribution: distribution,
      lastReviewedAt: new Date(),
    });
  } else if (qCount > 0) {
    const avg = Math.round((qSum / qCount) * 10) / 10;
    await StrainModel.findByIdAndUpdate(strainId, {
      averageRatings: { overall: avg, potency: 0, flavor: 0, aroma: 0, appearance: 0, effects: 0 },
      reviewCount: qCount,
      reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  } else {
    await StrainModel.findByIdAndUpdate(strainId, {
      averageRatings: { overall: 0, potency: 0, flavor: 0, aroma: 0, appearance: 0, effects: 0 },
      reviewCount: 0,
      reviewDistribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    });
  }

  // Recalculate conditionVotes from all published reviews
  const conditionReviews = await ReviewModel.find(
    { strainId, status: "published", conditionsHelped: { $exists: true, $not: { $size: 0 } } },
    { conditionsHelped: 1 }
  ).lean();
  const votes: Record<string, number> = {};
  for (const rev of conditionReviews) {
    for (const c of rev.conditionsHelped ?? []) {
      votes[c] = (votes[c] ?? 0) + 1;
    }
  }
  await StrainModel.findByIdAndUpdate(strainId, { conditionVotes: votes });
}

// Map entity type to its Mongoose model name
const ENTITY_MODEL_MAP: Record<ReviewEntityType, string> = {
  strain: "Strain",
  product: "Product",
  brand: "Brand",
  dispensary: "Dispensary",
};

export async function recalculateEntityRatings(entityType: ReviewEntityType, entityId: string) {
  await connectDB();

  const entityObjectId = new mongoose.Types.ObjectId(entityId);

  const result = await ReviewModel.aggregate([
    { $match: { entityType, entityId: entityObjectId, status: "published" } },
    {
      $group: {
        _id: null,
        count: { $sum: 1 },
        avgOverall: { $avg: "$ratings.overall" },
      },
    },
  ]);

  const distResult = await ReviewModel.aggregate([
    { $match: { entityType, entityId: entityObjectId, status: "published" } },
    { $group: { _id: "$ratings.overall", count: { $sum: 1 } } },
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of distResult) {
    const rounded = Math.round(d._id);
    if (rounded >= 1 && rounded <= 5) distribution[rounded] = d.count;
  }

  const modelName = ENTITY_MODEL_MAP[entityType];
  const Model = mongoose.model(modelName);

  if (result.length > 0) {
    const r = result[0];
    const update: Record<string, unknown> = {
      averageRating: Math.round(r.avgOverall * 10) / 10,
      reviewCount: r.count,
    };
    if (entityType === "product") update.reviewDistribution = distribution;
    await Model.findByIdAndUpdate(entityId, update);
  } else {
    const update: Record<string, unknown> = { averageRating: 0, reviewCount: 0 };
    if (entityType === "product") update.reviewDistribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    await Model.findByIdAndUpdate(entityId, update);
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
