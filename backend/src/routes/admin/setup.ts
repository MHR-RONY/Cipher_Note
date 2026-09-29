import express from "express";
import { runSetup, setupStatus } from "../../controllers/setupController.js";
import { validate } from "../../middleware/validate.js";
import { setupSchema } from "../../validators/admin.js";

const router = express.Router();

router.get("/status", setupStatus);
router.post("/", validate(setupSchema), runSetup);

export default router;
