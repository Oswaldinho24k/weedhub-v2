import mongoose, { Schema, type Document } from "mongoose";

export type ArticleCategory =
  | "cepa"
  | "producto"
  | "metodos"
  | "legal"
  | "cultura"
  | "ciencia"
  | "entrevista";

export type ArticleLocale = "es" | "en" | "pt";

export interface IArticle extends Document {
  title: string;
  slug: string;
  excerpt: string;
  body: string; // Markdown
  coverImage?: string;
  author: {
    userId?: mongoose.Types.ObjectId;
    name: string;
    avatar?: string;
    role?: string; // "Editor WeedHub", "Sommelier Cannábico", etc.
  };
  category: ArticleCategory;
  tags: string[];
  locale: ArticleLocale;
  relatedStrains: mongoose.Types.ObjectId[];
  relatedProducts: mongoose.Types.ObjectId[];
  relatedBrands: mongoose.Types.ObjectId[];
  status: "draft" | "published" | "archived";
  publishedAt?: Date;
  viewCount: number;
  // SEO overrides (fall back to title/excerpt when absent)
  metaTitle?: string;
  metaDescription?: string;
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticle>(
  {
    title: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    excerpt: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    coverImage: String,
    author: {
      userId: { type: Schema.Types.ObjectId, ref: "User" },
      name: { type: String, required: true, trim: true },
      avatar: String,
      role: { type: String, trim: true },
    },
    category: {
      type: String,
      enum: ["cepa", "producto", "metodos", "legal", "cultura", "ciencia", "entrevista"],
      required: true,
    },
    tags: { type: [String], default: [] },
    locale: {
      type: String,
      enum: ["es", "en", "pt"],
      default: "es",
    },
    relatedStrains: [{ type: Schema.Types.ObjectId, ref: "Strain" }],
    relatedProducts: [{ type: Schema.Types.ObjectId, ref: "Product" }],
    relatedBrands: [{ type: Schema.Types.ObjectId, ref: "Brand" }],
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    publishedAt: Date,
    viewCount: { type: Number, default: 0 },
    metaTitle: { type: String, trim: true },
    metaDescription: { type: String, trim: true },
  },
  { timestamps: true }
);

articleSchema.index({ slug: 1 }, { unique: true });
articleSchema.index({ status: 1, locale: 1, publishedAt: -1 });
articleSchema.index({ category: 1, status: 1 });
articleSchema.index({ tags: 1 });
articleSchema.index({ "author.userId": 1 });
articleSchema.index({ relatedStrains: 1 });

export const ArticleModel =
  (mongoose.models.Article as mongoose.Model<IArticle>) ||
  mongoose.model<IArticle>("Article", articleSchema);
