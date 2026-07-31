import mongoose, { Schema, type Document } from "mongoose";

export interface IBrand extends Document {
  name: string;
  slug: string;
  description?: string;
  descriptions?: { es?: string; en?: string; pt?: string };
  logo?: string;
  coverImage?: string;
  country: string;
  city?: string;
  website?: string;
  instagram?: string;
  tiktok?: string;
  email?: string;
  status: "active" | "pending" | "suspended";
  tier: "free" | "premium" | "enterprise";
  isVerified: boolean;
  verifiedAt?: Date;
  ownerId?: mongoose.Types.ObjectId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: "active" | "past_due" | "canceled" | "trialing" | "incomplete";
  productCount: number;
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const brandSchema = new Schema<IBrand>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    descriptions: { es: String, en: String, pt: String },
    logo: String,
    coverImage: String,
    country: { type: String, required: true, default: "MX", uppercase: true },
    city: { type: String, trim: true },
    website: String,
    instagram: String,
    tiktok: String,
    email: { type: String, trim: true, lowercase: true },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "pending",
    },
    tier: {
      type: String,
      enum: ["free", "premium", "enterprise"],
      default: "free",
    },
    isVerified: { type: Boolean, default: false },
    verifiedAt: Date,
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    stripeSubscriptionStatus: {
      type: String,
      enum: ["active", "past_due", "canceled", "trialing", "incomplete"],
    },
    productCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

brandSchema.index({ slug: 1 }, { unique: true });
brandSchema.index({ status: 1, tier: 1 });
brandSchema.index({ isVerified: 1 });
brandSchema.index({ country: 1 });
brandSchema.index({ averageRating: -1 });

export const BrandModel =
  (mongoose.models.Brand as mongoose.Model<IBrand>) ||
  mongoose.model<IBrand>("Brand", brandSchema);
