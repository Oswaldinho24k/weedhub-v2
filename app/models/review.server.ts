import mongoose, { Schema, type Document } from "mongoose";

export type ReviewEntityType = "strain" | "product" | "brand" | "dispensary";
export type ReviewType = "community" | "expert" | "editorial";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  // Polymorphic entity reference
  entityType: ReviewEntityType;
  entityId: mongoose.Types.ObjectId;
  // Legacy field — kept for backward compat with existing strain reviews + recalculateStrainRatings
  strainId?: mongoose.Types.ObjectId;

  reviewType: ReviewType;
  expertAffiliation?: string;
  isSponsored: boolean;

  ratings: {
    overall: number;
    // Strain-specific
    potency?: number;
    flavor?: number;
    aroma?: number;
    appearance?: number;
    effects?: number;
    // Product-specific
    quality?: number;
    value?: number;
    // Dispensary-specific
    service?: number;
    atmosphere?: number;
    selection?: number;
  };
  comment: string;
  context: {
    method: string;
    timeOfDay: string;
    setting: string;
  };
  effectsExperienced: string[];
  conditionsHelped: string[];
  helpfulVotes: mongoose.Types.ObjectId[];
  helpfulCount: number;
  status: "published" | "flagged" | "removed";
  publishedAs: "username" | "anonymous";
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },

    entityType: {
      type: String,
      enum: ["strain", "product", "brand", "dispensary"],
      default: "strain",
      required: true,
    },
    entityId: { type: Schema.Types.ObjectId, required: true },

    // Legacy — only set when entityType === "strain"
    strainId: { type: Schema.Types.ObjectId, ref: "Strain" },

    reviewType: {
      type: String,
      enum: ["community", "expert", "editorial"],
      default: "community",
    },
    expertAffiliation: { type: String, trim: true },
    isSponsored: { type: Boolean, default: false },

    ratings: {
      overall: { type: Number, required: true, min: 1, max: 5 },
      potency: { type: Number, min: 1, max: 5 },
      flavor: { type: Number, min: 1, max: 5 },
      aroma: { type: Number, min: 1, max: 5 },
      appearance: { type: Number, min: 1, max: 5 },
      effects: { type: Number, min: 1, max: 5 },
      quality: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      atmosphere: { type: Number, min: 1, max: 5 },
      selection: { type: Number, min: 1, max: 5 },
    },
    comment: { type: String, default: "" },
    context: {
      method: { type: String, default: "" },
      timeOfDay: { type: String, default: "" },
      setting: { type: String, default: "" },
    },
    effectsExperienced: [String],
    conditionsHelped: { type: [String], default: [] },
    helpfulVotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    helpfulCount: { type: Number, default: 0 },
    status: {
      type: String,
      enum: ["published", "flagged", "removed"],
      default: "published",
    },
    publishedAs: {
      type: String,
      enum: ["username", "anonymous"],
      default: "anonymous",
      required: true,
    },
  },
  { timestamps: true }
);

// Primary polymorphic index
reviewSchema.index({ entityType: 1, entityId: 1, createdAt: -1 });
// One review per user per entity
reviewSchema.index({ userId: 1, entityType: 1, entityId: 1 }, { unique: true });
// Legacy compat — existing queries still use strainId directly
reviewSchema.index({ strainId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, strainId: 1 });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ publishedAs: 1 });
reviewSchema.index({ reviewType: 1 });

export const ReviewModel =
  (mongoose.models.Review as mongoose.Model<IReview>) ||
  mongoose.model<IReview>("Review", reviewSchema);
