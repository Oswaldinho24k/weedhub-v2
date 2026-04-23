import mongoose, { Schema, type Document } from "mongoose";

export type SubmissionStatus =
  | "pending"
  | "approved"
  | "rejected"
  | "rejected_auto"
  | "duplicate"
  | "merged_as_alias";

export interface IStrainSubmission extends Document {
  submittedBy: mongoose.Types.ObjectId;
  name: string;
  normalizedName: string;
  type: "sativa" | "indica" | "hybrid" | "unknown";
  lineage?: string;
  description?: string;
  sourceUrl?: string;
  reasoning: string;
  photo?: string;
  status: SubmissionStatus;
  reviewedBy?: mongoose.Types.ObjectId;
  reviewedAt?: Date;
  rejectionReason?: string;
  moderationNotes?: string;
  linkedStrainId?: mongoose.Types.ObjectId;
  potentialDuplicateStrainId?: mongoose.Types.ObjectId;
  userOverrodeDuplicate: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const submissionSchema = new Schema<IStrainSubmission>(
  {
    submittedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    name: { type: String, required: true, trim: true, minlength: 3, maxlength: 80 },
    normalizedName: { type: String, required: true, lowercase: true },
    type: {
      type: String,
      enum: ["sativa", "indica", "hybrid", "unknown"],
      default: "unknown",
    },
    lineage: { type: String, trim: true, maxlength: 200 },
    description: { type: String, trim: true, maxlength: 500 },
    sourceUrl: { type: String, trim: true, maxlength: 500 },
    reasoning: { type: String, required: true, trim: true, minlength: 20, maxlength: 500 },
    photo: String,
    status: {
      type: String,
      enum: ["pending", "approved", "rejected", "rejected_auto", "duplicate", "merged_as_alias"],
      default: "pending",
      required: true,
    },
    reviewedBy: { type: Schema.Types.ObjectId, ref: "User" },
    reviewedAt: Date,
    rejectionReason: String,
    moderationNotes: String,
    linkedStrainId: { type: Schema.Types.ObjectId, ref: "Strain" },
    potentialDuplicateStrainId: { type: Schema.Types.ObjectId, ref: "Strain" },
    userOverrodeDuplicate: { type: Boolean, default: false },
  },
  { timestamps: true }
);

submissionSchema.index({ normalizedName: 1 });
submissionSchema.index({ submittedBy: 1, createdAt: -1 });
submissionSchema.index({ status: 1, createdAt: -1 });

export const StrainSubmissionModel =
  (mongoose.models.StrainSubmission as mongoose.Model<IStrainSubmission>) ||
  mongoose.model<IStrainSubmission>("StrainSubmission", submissionSchema);
