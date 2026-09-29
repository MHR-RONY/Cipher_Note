import crypto from "node:crypto";
import { Admin } from "../models/Admin.js";
import { SETUP_LOCK_ID, SetupLock } from "../models/SetupLock.js";
import type { ValidatedRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError, notFoundError } from "../utils/httpError.js";
import type { setupSchema } from "../validators/admin.js";
import { adminSession } from "./adminAuthController.js";

const setupRequired = async (): Promise<boolean> => (await Admin.exists({})) === null;

// Digests are always 32 bytes, so timingSafeEqual never throws on a length mismatch
// and a wrong key leaks neither its content nor its length.
const digest = (value: string): Buffer => crypto.createHash("sha256").update(value).digest();

const validSetupKey = (submitted: string): boolean => {
  const expected = process.env["ADMIN_SETUP_KEY"];
  if (!expected) return false;
  return crypto.timingSafeEqual(digest(submitted), digest(expected));
};

const duplicateKey = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

export const setupStatus = asyncHandler(async (_req, res) => {
  res.json({ required: await setupRequired() });
});

export const runSetup = asyncHandler<ValidatedRequest<typeof setupSchema>>(async (req, res) => {
  if (!(await setupRequired())) throw notFoundError();

  const { name, email, password, setupKey } = req.body;
  if (!validSetupKey(setupKey)) throw new HttpError(403, "Invalid setup key");

  try {
    await SetupLock.create({ _id: SETUP_LOCK_ID });
  } catch (error) {
    if (duplicateKey(error)) throw notFoundError();
    throw error;
  }

  try {
    const admin = await Admin.create({ name, email, password });
    res.status(201).json(adminSession(admin));
  } catch (error) {
    await SetupLock.deleteOne({ _id: SETUP_LOCK_ID });
    throw error;
  }
});
