import mongoose from "mongoose";

const schema = new mongoose.Schema(
  {
    _id: { type: String },
    createdAt: { type: Date, default: Date.now },
  },
  { versionKey: false },
);

export const SetupLock = mongoose.model("SetupLock", schema);
