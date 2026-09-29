import bcrypt from "bcryptjs";
import type { AuthedRequest } from "../middleware/authUser.js";
import type { ValidatedRequest } from "../middleware/validate.js";
import { User, type PublicUser, type UserDocument } from "../models/User.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { DUMMY_PASSWORD_HASH } from "../utils/password.js";
import { signUserToken } from "../utils/token.js";
import type { loginSchema, registerSchema } from "../validators/user.js";

const publicUser = (user: UserDocument): PublicUser => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  interests: user.interests,
  createdAt: user.createdAt,
});

export const register = asyncHandler<ValidatedRequest<typeof registerSchema>>(async (req, res) => {
  const { name, email, password, interests } = req.body;
  const user = await User.create({ name, email, password, interests });
  res.status(201).json({ token: signUserToken(user._id.toString()), user: publicUser(user) });
});

export const login = asyncHandler<ValidatedRequest<typeof loginSchema>>(async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email }).select("+password");

  // Always run one compare so a missing account costs the same as a wrong password.
  const matches = await bcrypt.compare(password, user?.password ?? DUMMY_PASSWORD_HASH);
  if (!user || !matches) throw new HttpError(401, "Invalid email or password");

  res.json({ token: signUserToken(user._id.toString()), user: publicUser(user) });
});

export const me = asyncHandler<AuthedRequest>(async (req, res) => {
  res.json({ user: publicUser(req.user) });
});
