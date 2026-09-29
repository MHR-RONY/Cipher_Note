import { User } from "../models/User.js";
import { verifyUserToken } from "../utils/token.js";

const deny = (res) => res.status(401).json({ message: "Not authenticated" });

export const authUser = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) return deny(res);

  try {
    const payload = verifyUserToken(header.slice(7));
    if (payload.role !== "user") return deny(res);

    const user = await User.findById(payload.sub);
    if (!user) return deny(res);

    req.user = user;
    next();
  } catch {
    deny(res);
  }
};
