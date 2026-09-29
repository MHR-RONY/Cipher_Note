import type { ErrorRequestHandler, RequestHandler } from "express";
import { HttpError } from "../utils/httpError.js";

export const notFound: RequestHandler = (_req, res) => {
  res.status(404).json({ message: "Not found" });
};

const duplicateKey = (error: unknown): boolean =>
  typeof error === "object" && error !== null && "code" in error && error.code === 11000;

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.status).json({ message: error.message });
    return;
  }
  if (duplicateKey(error)) {
    res.status(409).json({ message: "Already exists" });
    return;
  }
  if (error instanceof SyntaxError || (error instanceof Error && error.name === "PayloadTooLargeError")) {
    res.status(400).json({ message: "Invalid request body" });
    return;
  }

  console.error(error);
  res.status(500).json({ message: "Internal server error" });
};
