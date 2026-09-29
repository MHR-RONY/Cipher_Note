import { Schema, model, type HydratedDocument, type Types } from "mongoose";

export interface PostDoc {
  _id: Types.ObjectId;
  title: string;
  body: string;
  author: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

export type PostDocument = HydratedDocument<PostDoc>;

const schema = new Schema<PostDoc>(
  {
    title: { type: String, required: true, trim: true },
    body: { type: String, required: true },
    author: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true },
);

schema.index({ author: 1, _id: -1 });

export const Post = model<PostDoc>("Post", schema);
