import mongoose, { Schema, type Document } from "mongoose";

export interface IDispensary extends Document {
  name: string;
  slug: string;
  description?: string;
  address: string;
  city: string;
  state?: string;
  country: string;
  lat?: number;
  lng?: number;
  phone?: string;
  website?: string;
  instagram?: string;
  logo?: string;
  coverImage?: string;
  brandId?: mongoose.Types.ObjectId;
  status: "active" | "pending" | "suspended";
  ownerId?: mongoose.Types.ObjectId;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripeSubscriptionStatus?: "active" | "past_due" | "canceled" | "trialing" | "incomplete";
  isVerified: boolean;
  tier: "free" | "premium" | "enterprise";
  averageRating: number;
  reviewCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const dispensarySchema = new Schema<IDispensary>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    description: { type: String, trim: true },
    address: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    state: { type: String, trim: true },
    country: { type: String, required: true, default: "MX", uppercase: true },
    lat: Number,
    lng: Number,
    phone: { type: String, trim: true },
    website: String,
    instagram: String,
    logo: String,
    coverImage: String,
    brandId: { type: Schema.Types.ObjectId, ref: "Brand" },
    status: {
      type: String,
      enum: ["active", "pending", "suspended"],
      default: "pending",
    },
    ownerId: { type: Schema.Types.ObjectId, ref: "User" },
    stripeCustomerId: String,
    stripeSubscriptionId: String,
    stripeSubscriptionStatus: {
      type: String,
      enum: ["active", "past_due", "canceled", "trialing", "incomplete"],
    },
    isVerified: { type: Boolean, default: false },
    tier: { type: String, enum: ["free", "premium", "enterprise"], default: "free" },
    averageRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

dispensarySchema.index({ slug: 1 }, { unique: true });
dispensarySchema.index({ city: 1, status: 1 });
dispensarySchema.index({ country: 1, status: 1 });
dispensarySchema.index({ brandId: 1 });
dispensarySchema.index({ lat: 1, lng: 1 });

export const DispensaryModel =
  (mongoose.models.Dispensary as mongoose.Model<IDispensary>) ||
  mongoose.model<IDispensary>("Dispensary", dispensarySchema);
