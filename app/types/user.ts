export type ExperienceLevel = "principiante" | "intermedio" | "experimentado" | "experto";
export type UserRole = "user" | "admin";

export interface CannabisProfile {
  experienceLevel: ExperienceLevel;
  preferredEffects: string[];
  preferredMethods: string[];
  preferredTime: string[];
  thcPreference: "low" | "medium" | "high" | "any";
  cbdPreference: "low" | "medium" | "high" | "any";
}

export interface UserStats {
  reviewCount: number;
  helpfulVotesReceived: number;
  strainsReviewed: number;
  joinedAt: string;
}

export interface BadgeDefinition {
  id: string;
  name: string;
  description: string;
  icon: string;
  requirement: number;
  type: "reviews" | "helpful" | "strains" | "special";
}

export interface EarnedBadge {
  badgeId: string;
  earnedAt: string;
}

export interface User {
  _id: string;
  email: string;
  displayName: string;
  avatar?: string;
  role: UserRole;
  cannabisProfile: CannabisProfile;
  stats: UserStats;
  earnedBadges: EarnedBadge[];
  points: number;
  onboardingCompleted: boolean;
  createdAt: string;
  updatedAt: string;
}
