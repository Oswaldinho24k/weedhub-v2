import mongoose, { Schema, type Document } from "mongoose";

export interface IQuickRating extends Document {
  userId: mongoose.Types.ObjectId;
  strainId: mongoose.Types.ObjectId;
  rating: number;
  quickEffects: string[];
  createdAt: Date;
  updatedAt: Date;
}

const quickRatingSchema = new Schema<IQuickRating>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    strainId: { type: Schema.Types.ObjectId, ref: "Strain", required: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    quickEffects: { type: [String], default: [] },
  },
  { timestamps: true }
);

// One quick rating per user per strain
quickRatingSchema.index({ userId: 1, strainId: 1 }, { unique: true });
quickRatingSchema.index({ strainId: 1 });

export const QuickRatingModel =
  (mongoose.models.QuickRating as mongoose.Model<IQuickRating>) ||
  mongoose.model<IQuickRating>("QuickRating", quickRatingSchema);
