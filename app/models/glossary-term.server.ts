import mongoose, { Schema, type Document } from "mongoose";

export type GlossaryCategory =
  | "cannabinoides"
  | "terpenos"
  | "extracciones"
  | "cultivo"
  | "consumo"
  | "legal"
  | "ciencia"
  | "cultura";

export interface IGlossaryTerm extends Document {
  slug: string;
  term: string;
  termEn?: string;
  termPt?: string;
  definition: string;
  definitionEn?: string;
  definitionPt?: string;
  category: GlossaryCategory;
  relatedSlugs: string[];
  relatedStrainSlugs: string[];
  examples?: string[];
  isActive: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}

const glossaryTermSchema = new Schema<IGlossaryTerm>(
  {
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    term: { type: String, required: true, trim: true },
    termEn: { type: String, trim: true },
    termPt: { type: String, trim: true },
    definition: { type: String, required: true, trim: true },
    definitionEn: { type: String, trim: true },
    definitionPt: { type: String, trim: true },
    category: {
      type: String,
      enum: ["cannabinoides", "terpenos", "extracciones", "cultivo", "consumo", "legal", "ciencia", "cultura"],
      required: true,
    },
    relatedSlugs: [{ type: String }],
    relatedStrainSlugs: [{ type: String }],
    examples: [{ type: String }],
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

glossaryTermSchema.index({ category: 1, term: 1 });

export const GlossaryTermModel =
  mongoose.models.GlossaryTerm ||
  mongoose.model<IGlossaryTerm>("GlossaryTerm", glossaryTermSchema);
