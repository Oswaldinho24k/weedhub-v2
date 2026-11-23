import { Schema } from "mongoose";

/** Editorial validation state shared by every content model (see services/content-review.server.ts). */
export const revisionSchemaDef = {
  status: { type: String, enum: ["pendiente", "aprobado", "rechazado"], default: undefined },
  reviewedAt: Date,
  reviewedBy: String,
  note: String,
  lastEditedBy: String,
  lastEditedAt: Date,
};

export const editorialNoteSchema = new Schema(
  {
    text: String,
    status: { type: String, enum: ["pendiente", "aprobado", "rechazado"] },
    generatedAt: Date,
    model: String,
    reviewedAt: Date,
    reviewedBy: String,
  },
  { _id: false }
);

export interface IRevision {
  status?: "pendiente" | "aprobado" | "rechazado";
  reviewedAt?: Date;
  reviewedBy?: string;
  note?: string;
  lastEditedBy?: string;
  lastEditedAt?: Date;
}
