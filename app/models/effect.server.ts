import mongoose, { Schema, type Document } from "mongoose";

export interface IEffect extends Document {
  key: string;
  labelEn: string;
  labelEs: string;
  labelPt: string;
  category: "positive" | "negative";
  status: "approved" | "pending" | "rejected";
  source: "system" | "community";
  usageCount: number;
  submittedBy?: mongoose.Types.ObjectId;
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const effectSchema = new Schema<IEffect>(
  {
    key:             { type: String, required: true, unique: true, lowercase: true, trim: true },
    labelEn:         { type: String, required: true, trim: true },
    labelEs:         { type: String, required: true, trim: true },
    labelPt:         { type: String, required: true, trim: true },
    category:        { type: String, enum: ["positive", "negative"], required: true },
    status:          { type: String, enum: ["approved", "pending", "rejected"], default: "pending" },
    source:          { type: String, enum: ["system", "community"], default: "system" },
    usageCount:      { type: Number, default: 0 },
    submittedBy:     { type: Schema.Types.ObjectId, ref: "User" },
    rejectionReason: String,
  },
  { timestamps: true }
);

effectSchema.index({ status: 1 });
effectSchema.index({ category: 1 });
effectSchema.index({ usageCount: -1 });

export const EffectModel =
  (mongoose.models.Effect as mongoose.Model<IEffect>) ||
  mongoose.model<IEffect>("Effect", effectSchema);
