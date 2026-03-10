import mongoose, { Schema, type Document } from "mongoose";

export interface ISavedStrain extends Document {
  userId: mongoose.Types.ObjectId;
  strainId: mongoose.Types.ObjectId;
  createdAt: Date;
}

const savedStrainSchema = new Schema<ISavedStrain>(
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
  },
  { timestamps: true }
);

savedStrainSchema.index({ userId: 1, strainId: 1 }, { unique: true });
savedStrainSchema.index({ userId: 1, createdAt: -1 });

export const SavedStrainModel =
  (mongoose.models.SavedStrain as mongoose.Model<ISavedStrain>) ||
  mongoose.model<ISavedStrain>("SavedStrain", savedStrainSchema);
