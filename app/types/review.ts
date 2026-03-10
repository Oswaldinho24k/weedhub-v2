export type ReviewStatus = "published" | "flagged" | "removed";

export interface RatingCategories {
  overall: number;
  potency: number;
  flavor: number;
  aroma: number;
  appearance: number;
  effects: number;
}

export interface ReviewContext {
  method: string;
  timeOfDay: string;
  setting: string;
}

export interface Review {
  _id: string;
  userId: string;
  ratings: RatingCategories;
  comment: string;
  context: ReviewContext;
  effectsExperienced: string[];
  helpfulVotes: string[];
  helpfulCount: number;
  status: ReviewStatus;
  createdAt: string;
  updatedAt: string;
}

export interface StrainReview extends Review {
  strainId: string;
  strain?: {
    _id: string;
    name: string;
    slug: string;
    type: string;
  };
  user?: {
    _id: string;
    displayName: string;
    avatar?: string;
    cannabisProfile?: {
      experienceLevel: string;
    };
  };
}
