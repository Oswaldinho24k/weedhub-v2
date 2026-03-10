import mongoose, { Schema, type Document } from "mongoose";

export interface IUser extends Document {
  email: string;
  passwordHash: string;
  displayName: string;
  avatar?: string;
  role: "user" | "admin";
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
    displayName: { type: String, required: true, trim: true },
    avatar: String,
    role: { type: String, enum: ["user", "admin"], default: "user" },
    cannabisProfile: {
      experienceLevel: {
        type: String,
        enum: ["principiante", "intermedio", "experimentado", "experto"],
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

export const UserModel =
  (mongoose.models.User as mongoose.Model<IUser>) ||
  mongoose.model<IUser>("User", userSchema);
