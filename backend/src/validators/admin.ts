import { z } from "zod";

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
