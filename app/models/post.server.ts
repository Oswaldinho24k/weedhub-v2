import mongoose, { Schema, type Document } from "mongoose";

export type PostCategory =
  | "cultivo"
  | "experiencias"
  | "cepas"
  | "legal"
  | "comunidad";

export interface IPost extends Document {
  userId: mongoose.Types.ObjectId;
  title: string;
  body: string;
  slug: string;
  category: PostCategory;
  tags: string[];
  strainId?: mongoose.Types.ObjectId;
  upvotes: mongoose.Types.ObjectId[];
  upvoteCount: number;
  commentCount: number;
  status: "published" | "removed";
  publishedAs: "username" | "anonymous";
  createdAt: Date;
  updatedAt: Date;
}

const postSchema = new Schema<IPost>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    body: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true },
    category: {
      type: String,
      enum: ["cultivo", "experiencias", "cepas", "legal", "comunidad"],
      required: true,
    },
    tags: { type: [String], default: [] },
    strainId: { type: Schema.Types.ObjectId, ref: "Strain" },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    upvoteCount: { type: Number, default: 0 },
    commentCount: { type: Number, default: 0 },
    status: { type: String, enum: ["published", "removed"], default: "published" },
    publishedAs: { type: String, enum: ["username", "anonymous"], default: "username" },
  },
  { timestamps: true }
);

postSchema.index({ slug: 1 }, { unique: true });
postSchema.index({ status: 1, category: 1, createdAt: -1 });
postSchema.index({ userId: 1, createdAt: -1 });
postSchema.index({ upvoteCount: -1, createdAt: -1 });

export const PostModel =
  (mongoose.models.Post as mongoose.Model<IPost>) ||
  mongoose.model<IPost>("Post", postSchema);
