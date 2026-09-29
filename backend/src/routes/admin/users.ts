import express from "express";
import { postsByAuthor, usersGroupedByInterests } from "../../controllers/aggregationController.js";
import {
  createUser,
  deleteUser,
  getUser,
  listUsers,
  updateUser,
} from "../../controllers/adminUserController.js";
import { authAdmin } from "../../middleware/authAdmin.js";
import { validate } from "../../middleware/validate.js";
import { userCreateSchema, userUpdateSchema } from "../../validators/admin.js";

const router = express.Router();

router.use(authAdmin);

router.get("/", listUsers);
router.post("/", validate(userCreateSchema), createUser);

// Must stay above "/:id" or Express reads the literal segment as an id.
router.get("/grouped-by-interests", usersGroupedByInterests);

router.get("/:id", getUser);
router.put("/:id", validate(userUpdateSchema), updateUser);
router.delete("/:id", deleteUser);
router.get("/:id/posts", postsByAuthor);

export default router;
