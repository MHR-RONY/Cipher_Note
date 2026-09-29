import { Schema, model } from "mongoose";

export interface SetupLockDoc {
  _id: string;
  createdAt: Date;
}

export const SETUP_LOCK_ID = "admin";

const schema = new Schema<SetupLockDoc>(
  { _id: { type: String, required: true } },
  { timestamps: { createdAt: true, updatedAt: false } },
);

export const SetupLock = model<SetupLockDoc>("SetupLock", schema);
