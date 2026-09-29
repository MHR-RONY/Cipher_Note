import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

const limiter = (windowMs: number, limit: number, message: string): RateLimitRequestHandler =>
  rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });

export const loginLimiter = limiter(15 * 60 * 1000, 10, "Too many login attempts. Try again later.");
export const registerLimiter = limiter(60 * 60 * 1000, 5, "Too many accounts created. Try again later.");
export const setupLimiter = limiter(60 * 60 * 1000, 5, "Too many setup attempts. Try again later.");
