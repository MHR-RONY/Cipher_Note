import express from "express";
import { postsByAuthor } from "../../controllers/aggregationController.js";
import { createPost, listPosts } from "../../controllers/postController.js";
import { authUser } from "../../middleware/authUser.js";
import { validate } from "../../middleware/validate.js";
import { postSchema } from "../../validators/user.js";

const router = express.Router();

router.use(authUser);

router.get("/", listPosts);
router.post("/", validate(postSchema), createPost);
router.get("/author/:id", postsByAuthor);

export default router;
