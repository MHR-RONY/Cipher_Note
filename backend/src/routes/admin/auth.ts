import express from "express";
import { login, me } from "../../controllers/adminAuthController.js";
import { authAdmin } from "../../middleware/authAdmin.js";
import { validate } from "../../middleware/validate.js";
import { adminLoginSchema } from "../../validators/admin.js";

const router = express.Router();

router.post("/login", validate(adminLoginSchema), login);
router.get("/me", authAdmin, me);

export default router;
