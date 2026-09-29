import express from "express";
import {
  createNote,
  deleteNote,
  getNote,
  listNotes,
  updateNote,
} from "../../controllers/noteController.js";
import { authUser } from "../../middleware/authUser.js";
import { validate } from "../../middleware/validate.js";
import { noteSchema } from "../../validators/user.js";

const router = express.Router();

router.use(authUser);

router.get("/", listNotes);
router.post("/", validate(noteSchema), createNote);
router.get("/:id", getNote);
router.put("/:id", validate(noteSchema), updateNote);
router.delete("/:id", deleteNote);

export default router;
