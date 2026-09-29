import type { Request, RequestHandler } from "express";
import type { ParamsDictionary } from "express-serve-static-core";
import { User, type UserDocument } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { bearerToken, verifyUserToken } from "../utils/token.js";

export type AuthedRequest<Body = unknown, Params = ParamsDictionary> = Request<
  Params,
  unknown,
  Body
> & { user: UserDocument };

export const authUser: RequestHandler = asyncHandler(async (req, _res, next) => {
  const payload = verifyUserToken(bearerToken(req));
  if (!payload) throw new HttpError(401, "Unauthorized");

  const user = await User.findById(payload.sub);
  if (!user) throw new HttpError(401, "Unauthorized");

  req.user = user;
  next();
});
