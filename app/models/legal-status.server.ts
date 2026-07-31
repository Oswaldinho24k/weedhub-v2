import mongoose, { Schema, type Document } from "mongoose";

export type LegalStatusType =
  | "legal-rec"      // Recreativo legal
  | "legal-med"      // Medicinal legal
  | "decriminalized" // Descriminalizado (posesión personal no es delito)
  | "partial"        // Varía por estado/provincia
  | "illegal";       // Ilegal

export type LegalRegion =
  | "mexico"
  | "latam-central"
  | "latam-south"
  | "latam-caribe"
  | "europe"
  | "north-america"
  | "other";

export interface ILegalStatusState {
  name: string;
  nameEs: string;
  status: LegalStatusType;
  note?: string;
}

export interface ILegalStatusSource {
  label: string;
  url?: string;
}

export interface ILegalStatus extends Document {
  countryCode: string; // ISO 3166-1 alpha-2
  countryName: string; // English name
  countryNameEs: string; // Spanish name
  countryNamePt?: string; // Portuguese name
  flag: string; // emoji flag
  region: LegalRegion;
  nationalStatus: LegalStatusType;
  // Summary shown on hub + country card
  summary: string; // 1-2 sentences, current situation in Spanish
  // Detail page content
  whatYouCan: string[];
  whatYouCant: string[];
  keyDate?: string; // e.g. "Desde 2017"
  keyLaw?: string; // e.g. "Ley de Narcomenudeo"
  // Sub-national breakdown (for federal countries)
  states?: ILegalStatusState[];
  sources: ILegalStatusSource[];
  lastReviewedAt: Date;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const legalStatusSchema = new Schema<ILegalStatus>(
  {
    countryCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
    countryName: { type: String, required: true, trim: true },
    countryNameEs: { type: String, required: true, trim: true },
    countryNamePt: { type: String, trim: true },
    flag: { type: String, required: true },
    region: {
      type: String,
      enum: ["mexico", "latam-central", "latam-south", "latam-caribe", "europe", "north-america", "other"],
      required: true,
    },
    nationalStatus: {
      type: String,
      enum: ["legal-rec", "legal-med", "decriminalized", "partial", "illegal"],
      required: true,
    },
    summary: { type: String, required: true, trim: true },
    whatYouCan: { type: [String], default: [] },
    whatYouCant: { type: [String], default: [] },
    keyDate: { type: String, trim: true },
    keyLaw: { type: String, trim: true },
    states: [
      {
        name: String,
        nameEs: String,
        status: {
          type: String,
          enum: ["legal-rec", "legal-med", "decriminalized", "partial", "illegal"],
        },
        note: String,
      },
    ],
    sources: [{ label: String, url: String }],
    lastReviewedAt: { type: Date, default: Date.now },
    sortOrder: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

legalStatusSchema.index({ region: 1, sortOrder: 1 });
legalStatusSchema.index({ nationalStatus: 1 });

export const LegalStatusModel =
  (mongoose.models.LegalStatus as mongoose.Model<ILegalStatus>) ||
  mongoose.model<ILegalStatus>("LegalStatus", legalStatusSchema);
