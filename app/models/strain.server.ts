import mongoose, { Schema, type Document } from "mongoose";

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

export interface IStrain extends Document {
  name: string;
  slug: string;
  type: "sativa" | "indica" | "hybrid";
  typeBlend?: string;
  description: string;
  descriptionEs?: string;
  lineage?: string;
  genetics: {
    parent1?: string;
    parent2?: string;
    breeder?: string;
  };
  cannabinoidProfile: {
    thc: { min: number; max: number };
    cbd: { min: number; max: number };
    cbg?: number;
    cbn?: number;
  };
  terpenes: Array<{ name: string; percentage: number }>;
  dominantTerpene?: string;
  effects: string[];
  flavors: string[];
  difficulty?: "Baja" | "Moderada" | "Alta";
  timeCurve?: TimeCurvePoint[];
  momento?: Momento;
  colorHint?: string;
  imageUrl?: string;
  averageRatings: {
    overall: number;
    potency: number;
    flavor: number;
    aroma: number;
    appearance: number;
    effects: number;
  };
  reviewCount: number;
  reviewDistribution: {
    1: number;
    2: number;
    3: number;
    4: number;
    5: number;
  };
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const strainSchema = new Schema<IStrain>(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    type: {
      type: String,
      enum: ["sativa", "indica", "hybrid"],
      required: true,
    },
    typeBlend: String,
    description: { type: String, required: true },
    descriptionEs: String,
    lineage: String,
    genetics: {
      parent1: String,
      parent2: String,
      breeder: String,
    },
    cannabinoidProfile: {
      thc: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
      },
      cbd: {
        min: { type: Number, default: 0 },
        max: { type: Number, default: 0 },
      },
      cbg: Number,
      cbn: Number,
    },
    terpenes: [
      {
        name: { type: String, required: true },
        percentage: { type: Number, required: true },
      },
    ],
    dominantTerpene: String,
    effects: [String],
    flavors: [String],
    difficulty: { type: String, enum: ["Baja", "Moderada", "Alta"] },
    timeCurve: [
      {
        t: String,
        label: String,
        energy: Number,
        calm: Number,
        cerebral: Number,
      },
    ],
    momento: {
      manana: Number,
      tarde: Number,
      noche: Number,
    },
    colorHint: String,
    imageUrl: String,
    averageRatings: {
      overall: { type: Number, default: 0 },
      potency: { type: Number, default: 0 },
      flavor: { type: Number, default: 0 },
      aroma: { type: Number, default: 0 },
      appearance: { type: Number, default: 0 },
      effects: { type: Number, default: 0 },
    },
    reviewCount: { type: Number, default: 0 },
    reviewDistribution: {
      1: { type: Number, default: 0 },
      2: { type: Number, default: 0 },
      3: { type: Number, default: 0 },
      4: { type: Number, default: 0 },
      5: { type: Number, default: 0 },
    },
    isArchived: { type: Boolean, default: false },
  },
  { timestamps: true }
);

strainSchema.index({ name: "text", description: "text" });
strainSchema.index({ slug: 1 }, { unique: true });
strainSchema.index({ type: 1 });
strainSchema.index({ "averageRatings.overall": -1 });
strainSchema.index({ reviewCount: -1 });

export const StrainModel =
  (mongoose.models.Strain as mongoose.Model<IStrain>) ||
  mongoose.model<IStrain>("Strain", strainSchema);
