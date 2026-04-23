import mongoose, { Schema, type Document } from "mongoose";

export interface IReview extends Document {
  userId: mongoose.Types.ObjectId;
  strainId: mongoose.Types.ObjectId;
  ratings: {
    overall: number;
    potency: number;
    flavor: number;
    aroma: number;
    appearance: number;
    effects: number;
  };
  comment: string;
  context: {
    method: string;
    timeOfDay: string;
    setting: string;
  };
  effectsExperienced: string[];
  helpfulVotes: mongoose.Types.ObjectId[];
  helpfulCount: number;
  status: "published" | "flagged" | "removed";
  publishedAs: "username" | "anonymous";
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    strainId: {
      type: Schema.Types.ObjectId,
      ref: "Strain",
      required: true,
    },
    ratings: {
      overall: { type: Number, required: true, min: 1, max: 5 },
      potency: { type: Number, required: true, min: 1, max: 5 },
      flavor: { type: Number, required: true, min: 1, max: 5 },
      aroma: { type: Number, required: true, min: 1, max: 5 },
      appearance: { type: Number, required: true, min: 1, max: 5 },
      effects: { type: Number, required: true, min: 1, max: 5 },
    },
    comment: { type: String, default: "" },
    context: {
      method: { type: String, default: "" },
      timeOfDay: { type: String, default: "" },
      setting: { type: String, default: "" },
    },
    effectsExperienced: [String],
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

reviewSchema.index({ strainId: 1, createdAt: -1 });
reviewSchema.index({ userId: 1, strainId: 1 }, { unique: true });
reviewSchema.index({ userId: 1, createdAt: -1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ publishedAs: 1 });

export const ReviewModel =
  (mongoose.models.Review as mongoose.Model<IReview>) ||
  mongoose.model<IReview>("Review", reviewSchema);
