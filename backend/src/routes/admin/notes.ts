import express from "express";
import { listNotes } from "../../controllers/adminNoteController.js";
import { authAdmin } from "../../middleware/authAdmin.js";

const router = express.Router();

router.use(authAdmin);
router.get("/", listNotes);

export default router;
