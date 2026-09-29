import { Types } from "mongoose";

// Returns null instead of throwing so a bad route param becomes a 404 with no query.
export const objectId = (value: unknown): Types.ObjectId | null =>
  typeof value === "string" && Types.ObjectId.isValid(value) ? new Types.ObjectId(value) : null;
