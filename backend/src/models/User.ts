import bcrypt from "bcryptjs";
import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { SALT_ROUNDS } from "../utils/password.js";

export interface UserDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  interests: string[];
  createdAt: Date;
  updatedAt: Date;
}

export type PublicUser = Pick<UserDoc, "_id" | "name" | "email" | "interests" | "createdAt">;
export type UserDocument = HydratedDocument<UserDoc>;

export const PUBLIC_USER_FIELDS = "name email interests createdAt";

const schema = new Schema<UserDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    interests: { type: [String], default: [] },
  },
  { timestamps: true },
);

schema.index({ email: 1 }, { unique: true });

schema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

export const User = model<UserDoc>("User", schema);
