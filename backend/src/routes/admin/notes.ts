import express from "express";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "../../controllers/adminNoteController.js";
import { authAdmin } from "../../middleware/authAdmin.js";
import { validate } from "../../middleware/validate.js";
import { adminNoteCreateSchema, adminNoteUpdateSchema } from "../../validators/admin.js";

const router = express.Router();

router.use(authAdmin);

router.get("/", listNotes);
router.post("/", validate(adminNoteCreateSchema), createNote);

router.get("/:id", getNote);
router.put("/:id", validate(adminNoteUpdateSchema), updateNote);
router.delete("/:id", deleteNote);

export default router;
