import type { z } from "zod";
import type { AuthedRequest } from "../middleware/authUser.js";
import { Post } from "../models/Post.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { paginate, paginated } from "../utils/paginate.js";
import type { postSchema } from "../validators/user.js";

type PostBody = z.infer<typeof postSchema>;

export const createPost = asyncHandler<AuthedRequest<PostBody>>(async (req, res) => {
  const { title, body } = req.body;
  const post = await Post.create({ title, body, author: req.user._id });
  res.status(201).json(post.toObject());
});

export const listPosts = asyncHandler<AuthedRequest>(async (req, res) => {
  const pagination = paginate(req);

  const [data, total] = await Promise.all([
    Post.find({})
      .sort({ _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .populate("author", "name")
      .lean(),
    Post.countDocuments({}),
  ]);

  res.json(paginated(data, total, pagination));
});
