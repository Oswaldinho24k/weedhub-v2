import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  username: string;
  anonymousHandle: string;
  publishAsAnonymous: boolean;
  displayName?: string;
  avatar?: string;
  role: "user" | "admin";
  country: string;
  city?: string;
  showCityPublicly: boolean;
  birthYear?: number;
  acquisitionSource?: string;
  locale?: string;
  cannabisProfile: {
    experienceLevel: string;
    preferredEffects: string[];
    preferredMethods: string[];
    preferredTime: string[];
    thcPreference: string;
    cbdPreference: string;
  };
  stats: {
    reviewCount: number;
    helpfulVotesReceived: number;
    strainsReviewed: number;
    joinedAt: Date;
  };
  earnedBadges: Array<{
    badgeId: string;
    earnedAt: Date;
  }>;
  points: number;
  onboardingCompleted: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true },
    username: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: /^[a-z0-9_]+$/,
      minlength: 3,
      maxlength: 20,
    },
    anonymousHandle: {
      type: String,
      required: true,
      unique: true,
    },
    publishAsAnonymous: { type: Boolean, default: true },
    displayName: { type: String, trim: true },
    avatar: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    country: { type: String, required: true, default: "MX", uppercase: true },
    city: { type: String, trim: true },
    showCityPublicly: { type: Boolean, default: false },
    birthYear: { type: Number, min: 1900, max: 2020 },
    acquisitionSource: {
      type: String,
      enum: ["friend", "search", "social", "press", "magazine", "event", "other"],
    },
    locale: String,
    cannabisProfile: {
      experienceLevel: {
        type: String,
        enum: [
          "principiante",
          "curioso",
          "novato",
          "ocasional",
          "regular",
          "intermedio",
          "experimentado",
          "experto",
        ],
        default: "principiante",
      },
      preferredEffects: [String],
      preferredMethods: [String],
      preferredTime: [String],
      thcPreference: {
        type: String,
        enum: ["low", "medium", "high", "any"],
        default: "any",
      },
      cbdPreference: {
        type: String,
        enum: ["low", "medium", "high", "any"],
        default: "any",
      },
    },
    stats: {
      reviewCount: { type: Number, default: 0 },
      helpfulVotesReceived: { type: Number, default: 0 },
      strainsReviewed: { type: Number, default: 0 },
      joinedAt: { type: Date, default: Date.now },
    },
    earnedBadges: [
      {
        badgeId: String,
        earnedAt: { type: Date, default: Date.now },
      },
    ],
    points: { type: Number, default: 0 },
    onboardingCompleted: { type: Boolean, default: false },
  },
  { timestamps: true }
);

userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ username: 1 }, { unique: true });
userSchema.index({ anonymousHandle: 1 }, { unique: true });
userSchema.index({ country: 1 });

export const UserModel =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
