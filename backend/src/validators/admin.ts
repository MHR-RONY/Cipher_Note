import { Types } from "mongoose";
import { z } from "zod";
import { noteSchema } from "./user.js";

// Normalize before the format check: zod applies .trim()/.toLowerCase() after
// z.email() would already have rejected " A@B.CO ".
const email = z.string().trim().toLowerCase().pipe(z.email());
const name = z.string().trim().min(1).max(120);
const password = z.string().min(8).max(200);
const interests = z.array(z.string().trim().min(1).max(60)).max(50).default([]);

export const setupSchema = z.object({
  name,
  email,
  password,
  setupKey: z.string().min(1),
});

// Login takes any non-empty string so a wrong email, a malformed email and a
// wrong password all reach the same constant-time failure.
export const adminLoginSchema = z.object({
  email: z.string().trim().toLowerCase().min(1),
  password: z.string().min(1),
});

export const userCreateSchema = z.object({ name, email, password, interests });

export const userUpdateSchema = z.object({
  name,
  email,
  interests,
  password: password.optional(),
});

// Format only. Existence is a separate 404 in the controller, since a well-formed
// id for a deleted user is a missing resource, not a malformed request.
const objectIdString = z
  .string()
  .trim()
  .refine((value) => Types.ObjectId.isValid(value), "must be a valid id");

// An admin writes notes on behalf of a user, so the owner is explicit in the body.
// Note.owner is a User ref, so an admin _id could never stand in for it.
export const adminNoteCreateSchema = noteSchema.extend({ ownerId: objectIdString });

export const adminNoteUpdateSchema = noteSchema;
