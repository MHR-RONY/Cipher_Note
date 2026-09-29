import { z } from "zod";

const text = (max: number) => z.string().trim().min(1).max(max);

export const registerSchema = z.object({
  name: text(100),
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(8).max(128),
  interests: z.array(text(50)).max(20).default([]),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().pipe(z.email().max(254)),
  password: z.string().min(1).max(128),
});

export const noteSchema = z.object({
  title: text(200),
  content: text(10_000),
});

export const postSchema = z.object({
  title: text(200),
  body: text(10_000),
});
