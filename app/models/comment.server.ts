import mongoose, { Schema, type Document } from "mongoose";

export interface IComment extends Document {
  postId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  body: string;
  upvotes: mongoose.Types.ObjectId[];
  upvoteCount: number;
  status: "published" | "removed";
  publishedAs: "username" | "anonymous";
  createdAt: Date;
  updatedAt: Date;
}

const commentSchema = new Schema<IComment>(
  {
    postId: { type: Schema.Types.ObjectId, ref: "Post", required: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
    body: { type: String, required: true, trim: true, maxlength: 2000 },
    upvotes: [{ type: Schema.Types.ObjectId, ref: "User" }],
    upvoteCount: { type: Number, default: 0 },
    status: { type: String, enum: ["published", "removed"], default: "published" },
    publishedAs: { type: String, enum: ["username", "anonymous"], default: "username" },
  },
  { timestamps: true }
);

commentSchema.index({ postId: 1, status: 1, createdAt: 1 });
commentSchema.index({ userId: 1, createdAt: -1 });

export const CommentModel =
  (mongoose.models.Comment as mongoose.Model<IComment>) ||
  mongoose.model<IComment>("Comment", commentSchema);
