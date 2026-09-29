import bcrypt from "bcryptjs";
import { Admin, type AdminDocument, type PublicAdmin } from "../models/Admin.js";
import type { AdminRequest } from "../middleware/authAdmin.js";
import type { ValidatedRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { HttpError } from "../utils/httpError.js";
import { DUMMY_PASSWORD_HASH } from "../utils/password.js";
import { signAdminToken } from "../utils/token.js";
import type { adminLoginSchema } from "../validators/admin.js";

export const publicAdmin = (admin: AdminDocument): PublicAdmin => ({
  _id: admin._id,
  name: admin.name,
  email: admin.email,
  createdAt: admin.createdAt,
});

export const adminSession = (admin: AdminDocument): { token: string; admin: PublicAdmin } => ({
  token: signAdminToken(admin._id.toString()),
  admin: publicAdmin(admin),
});

export const login = asyncHandler<ValidatedRequest<typeof adminLoginSchema>>(async (req, res) => {
  const { email, password } = req.body;
  const admin = await Admin.findOne({ email }).select("+password");

  const matches = await bcrypt.compare(password, admin?.password ?? DUMMY_PASSWORD_HASH);
  if (!admin || !matches) throw new HttpError(401, "Invalid email or password");

  res.json(adminSession(admin));
});

export const me = asyncHandler<AdminRequest>(async (req, res) => {
  res.json({ admin: publicAdmin(req.admin) });
});
