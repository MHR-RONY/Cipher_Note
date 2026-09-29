import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export interface NoteDoc {
  _id: Types.ObjectId;
  title: string;
  content: string;
  owner: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type NoteDocument = HydratedDocument<NoteDoc>;

const schema = new Schema<NoteDoc>(
  {
    title: { type: String, required: true, trim: true },
    content: { type: String, required: true },
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

schema.index({ owner: 1, _id: -1 });

export const Note = model<NoteDoc>("Note", schema);
