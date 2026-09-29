import mongoose from "mongoose";
import bcrypt from "bcryptjs";

const schema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, lowercase: true, trim: true },
    password: { type: String, required: true, select: false },
    interests: { type: [String], default: [] },
  },
  { timestamps: true },
);

schema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

schema.index({ email: 1 }, { unique: true });

export const User = mongoose.model("User", schema);
