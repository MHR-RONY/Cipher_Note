import bcrypt from "bcryptjs";
import { Schema, model, type HydratedDocument, type Types } from "mongoose";
import { SALT_ROUNDS } from "../utils/password.js";

export interface AdminDoc {
  _id: Types.ObjectId;
  name: string;
  email: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}

export type PublicAdmin = Pick<AdminDoc, "_id" | "name" | "email" | "createdAt">;
export type AdminDocument = HydratedDocument<AdminDoc>;

export const PUBLIC_ADMIN_FIELDS = "name email createdAt";

const schema = new Schema<AdminDoc>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
  },
  { timestamps: true },
);

schema.pre("save", async function hashPassword() {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
});

export const Admin = model<AdminDoc>("Admin", schema);
