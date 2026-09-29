import { Admin } from "../models/Admin.js";
import { verifyAdminToken } from "../utils/token.js";

const deny = (res) => res.status(401).json({ message: "Not authenticated" });

export const authAdmin = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return deny(res);

  try {
    const payload = verifyAdminToken(header.slice(7));
    if (payload.role !== "admin") return deny(res);

    const admin = await Admin.findById(payload.sub);
    if (!admin) return deny(res);

    req.admin = admin;
    next();
  } catch {
    deny(res);
  }
};
