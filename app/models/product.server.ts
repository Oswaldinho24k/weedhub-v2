import mongoose, { Schema, type Document } from "mongoose";

export interface IProduct extends Document {
  brandId: mongoose.Types.ObjectId;
  categoryKey: string;
  name: string;
  slug: string;
  strainId?: mongoose.Types.ObjectId;
  description?: string;
  descriptions?: { es?: string; en?: string; pt?: string };
  images: string[];
  coverImage?: string;
  cannabinoidProfile?: {
    thc: { min: number; max: number };
    cbd: { min: number; max: number };
  };
  price?: number;
  priceCurrency: "MXN" | "USD";
  status: "active" | "draft" | "archived";
  isPromoted: boolean;
  promotedAt?: Date;
  averageRating: number;
  reviewCount: number;
  reviewDistribution: { 1: number; 2: number; 3: number; 4: number; 5: number };
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    brandId: { type: Schema.Types.ObjectId, ref: "Brand", required: true },
    categoryKey: { type: String, required: true, lowercase: true, trim: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    strainId: { type: Schema.Types.ObjectId, ref: "Strain" },
    description: { type: String, trim: true },
    descriptions: { es: String, en: String, pt: String },
    images: { type: [String], default: [] },
    coverImage: String,
    cannabinoidProfile: {
      thc: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
      },
      cbd: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
      },
    },
    price: Number,
    priceCurrency: { type: String, enum: ["MXN", "USD"], default: "MXN" },
    status: {
      type: String,
      enum: ["active", "draft", "archived"],
      default: "draft",
    },
    isPromoted: { type: Boolean, default: false },
    promotedAt: Date,
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    reviewDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
  },
  { timestamps: true }
);

productSchema.index({ slug: 1 }, { unique: true });
productSchema.index({ brandId: 1, status: 1 });
productSchema.index({ categoryKey: 1, status: 1 });
productSchema.index({ strainId: 1 });
productSchema.index({ isPromoted: 1, status: 1 });
productSchema.index({ averageRating: -1 });

export const ProductModel =
  (mongoose.models.Product as mongoose.Model<IProduct>) ||
  mongoose.model<IProduct>("Product", productSchema);
