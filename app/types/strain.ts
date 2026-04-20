export type StrainType = "sativa" | "indica" | "hybrid";

export interface CannabinoidProfile {
  thc: { min: number; max: number };
  cbd: { min: number; max: number };
  cbg?: number;
  cbn?: number;
}

export interface TerpeneEntry {
  name: string;
  percentage: number;
}

export interface StrainRatings {
  overall: number;
  potency: number;
  flavor: number;
  aroma: number;
  appearance: number;
  effects: number;
}

export interface ReviewDistribution {
  1: number;
  2: number;
  3: number;
  4: number;
  5: number;
}

export interface TimeCurvePoint {
  t: string;
  label: string;
  energy: number;
  calm: number;
  cerebral: number;
}

export interface Momento {
  manana: number;
  tarde: number;
  noche: number;
}

export interface Strain {
  _id: string;
  name: string;
  slug: string;
  type: StrainType;
  typeBlend?: string;
  description: string;
  descriptionEs?: string;
  lineage?: string;
  genetics: {
    parent1?: string;
    parent2?: string;
    breeder?: string;
  };
  cannabinoidProfile: CannabinoidProfile;
  terpenes: TerpeneEntry[];
  dominantTerpene?: string;
  effects: string[];
  flavors: string[];
  difficulty?: "Baja" | "Moderada" | "Alta";
  timeCurve?: TimeCurvePoint[];
  momento?: Momento;
  colorHint?: string;
  imageUrl?: string;
  averageRatings: StrainRatings;
  reviewCount: number;
  reviewDistribution: ReviewDistribution;
  isArchived: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface StrainFilters {
  search?: string;
  type?: StrainType;
  effects?: string[];
  sort?: "rating" | "reviews" | "name" | "newest";
  page?: number;
}
