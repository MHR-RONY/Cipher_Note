import express from "express";
import { login, me, register } from "../../controllers/userAuthController.js";
import { authUser } from "../../middleware/authUser.js";
import { validate } from "../../middleware/validate.js";
import { loginSchema, registerSchema } from "../../validators/user.js";

const router = express.Router();

router.post("/register", validate(registerSchema), register);
router.post("/login", validate(loginSchema), login);
router.get("/me", authUser, me);

export default router;
