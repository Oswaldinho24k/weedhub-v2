import mongoose, { Schema, type Document } from "mongoose";

export interface IProductCategory extends Document {
  key: string;
  labelEs: string;
  labelEn: string;
  labelPt: string;
  icon: string;
  color?: string;
  sector: "consumo" | "cultivo";
  hasCannabinoidsProfile: boolean;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productCategorySchema = new Schema<IProductCategory>(
  {
    key: { type: String, required: true, unique: true, lowercase: true, trim: true },
    labelEs: { type: String, required: true, trim: true },
    labelEn: { type: String, required: true, trim: true },
    labelPt: { type: String, required: true, trim: true },
    icon: { type: String, required: true, default: "bolt" },
    color: String,
    sector: {
      type: String,
      enum: ["consumo", "cultivo"],
      default: "consumo",
      required: true,
    },
    hasCannabinoidsProfile: { type: Boolean, default: false },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

productCategorySchema.index({ isActive: 1, sector: 1, sortOrder: 1 });

export const ProductCategoryModel =
  (mongoose.models.ProductCategory as mongoose.Model<IProductCategory>) ||
  mongoose.model<IProductCategory>("ProductCategory", productCategorySchema);
