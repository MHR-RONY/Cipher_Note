import type { AdminDocument } from "../models/Admin.js";
import type { UserDocument } from "../models/User.js";

declare global {
  namespace Express {
    interface Request {
      user?: UserDocument;
      admin?: AdminDocument;
    }
  }
}
