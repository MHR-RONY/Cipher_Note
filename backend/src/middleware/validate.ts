import type { Request, RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { ZodError, type ZodType, type output } from "zod";

export type ValidatedRequest<Schema extends ZodType, Params = ParamsDictionary> = Request<
  Params,
  unknown,
  output<Schema>
>;

const firstIssue = (error: ZodError): string => {
  const issue = error.issues[0];
  if (!issue) return "Invalid request body";
  const path = issue.path.join(".");
  return path ? `${path}: ${issue.message}` : issue.message;
};

export const validate =
  (schema: ZodType): RequestHandler =>
  (req, res, next) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        res.status(400).json({ message: firstIssue(error) });
        return;
      }
      next(error);
    }
  };
