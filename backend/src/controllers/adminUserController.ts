import type { ParamsDictionary } from "express-serve-static-core";
import { Note } from "../models/Note.js";
import { Post } from "../models/Post.js";
import { PUBLIC_USER_FIELDS, User, type PublicUser, type UserDocument } from "../models/User.js";
import type { AdminRequest } from "../middleware/authAdmin.js";
import type { ValidatedRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFoundError } from "../utils/httpError.js";
import { objectId } from "../utils/objectId.js";
import { paginate, paginated } from "../utils/paginate.js";
import type { userCreateSchema, userUpdateSchema } from "../validators/admin.js";

type IdParams = ParamsDictionary & { id: string };

const publicUser = (user: UserDocument): PublicUser => ({
  _id: user._id,
  name: user.name,
  email: user.email,
  interests: user.interests,
  createdAt: user.createdAt,
});

export const listUsers = asyncHandler<AdminRequest>(async (req, res) => {
  const pagination = paginate(req);
  const [data, total] = await Promise.all([
    User.find()
      .select(PUBLIC_USER_FIELDS)
      .sort({ _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    User.countDocuments({}),
  ]);
  res.json(paginated(data, total, pagination));
});

export const createUser = asyncHandler<ValidatedRequest<typeof userCreateSchema>>(async (req, res) => {
  const user = await User.create(req.body);
  res.status(201).json({ user: publicUser(user) });
});

export const getUser = asyncHandler<AdminRequest<unknown, IdParams>>(async (req, res) => {
  const id = objectId(req.params.id);
  if (!id) throw notFoundError();

  const user = await User.findById(id).select(PUBLIC_USER_FIELDS).lean();
  if (!user) throw notFoundError();

  res.json({ user });
});

// Loaded and saved rather than findByIdAndUpdate so the schema's pre("save") hook
// hashes a new password. The password is selected so its required validator passes;
// when the body omits it the field stays unmodified and is not re-hashed.
export const updateUser = asyncHandler<ValidatedRequest<typeof userUpdateSchema, IdParams>>(
  async (req, res) => {
    const id = objectId(req.params.id);
    if (!id) throw notFoundError();

    const user = await User.findById(id).select("+password");
    if (!user) throw notFoundError();

    user.set(req.body);
    await user.save();

    res.json({ user: publicUser(user) });
  },
);

export const deleteUser = asyncHandler<AdminRequest<unknown, IdParams>>(async (req, res) => {
  const id = objectId(req.params.id);
  if (!id) throw notFoundError();

  if (!(await User.exists({ _id: id }))) throw notFoundError();

  // No transaction on a standalone mongod. The owner row goes last so a failed
  // cascade leaves the user in place and the admin can retry to a clean state.
  await Promise.all([Note.deleteMany({ owner: id }), Post.deleteMany({ author: id })]);
  await User.deleteOne({ _id: id });

  res.status(204).end();
});
