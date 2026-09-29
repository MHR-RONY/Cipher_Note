import type { Request, RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { Admin, type AdminDocument } from "../models/Admin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { bearerToken, verifyAdminToken } from "../utils/token.js";

export type AdminRequest<Body = unknown, Params = ParamsDictionary> = Request<
  Params,
  unknown,
  Body
> & { admin: AdminDocument };

export const authAdmin: RequestHandler = asyncHandler(async (req, _res, next) => {
  const payload = verifyAdminToken(bearerToken(req));
  if (!payload) throw new HttpError(401, "Unauthorized");

  const admin = await Admin.findById(payload.sub);
  if (!admin) throw new HttpError(401, "Unauthorized");

  req.admin = admin;
  next();
});
