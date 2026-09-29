import rateLimit, { type RateLimitRequestHandler } from "express-rate-limit";

const limiters: RateLimitRequestHandler[] = [];

const limiter = (windowMs: number, limit: number, message: string): RateLimitRequestHandler => {
  const handler = rateLimit({
    windowMs,
    limit,
    standardHeaders: true,
    legacyHeaders: false,
    message: { message },
  });
  limiters.push(handler);
  return handler;
};

// The whole test suite shares one process, so limiter counters carry across files
// and a later test can be throttled by an earlier one. Tests call this between
// cases; nothing in the running app uses it.
export const resetLimiters = (): void => {
  for (const handler of limiters) handler.resetKey?.("::ffff:127.0.0.1");
};

export const loginLimiter = limiter(15 * 60 * 1000, 10, "Too many login attempts. Try again later.");
export const registerLimiter = limiter(60 * 60 * 1000, 5, "Too many accounts created. Try again later.");
export const setupLimiter = limiter(60 * 60 * 1000, 5, "Too many setup attempts. Try again later.");
