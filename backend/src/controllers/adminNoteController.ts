import type { ParamsDictionary } from "express-serve-static-core";
import { Note } from "../models/Note.js";
import { User } from "../models/User.js";
import type { AdminRequest } from "../middleware/authAdmin.js";
import type { ValidatedRequest } from "../middleware/validate.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFoundError } from "../utils/httpError.js";
import { objectId } from "../utils/objectId.js";
import { paginate, paginated } from "../utils/paginate.js";
import type { adminNoteCreateSchema, adminNoteUpdateSchema } from "../validators/admin.js";

type IdParams = ParamsDictionary & { id: string };

export const listNotes = asyncHandler<AdminRequest>(async (req, res) => {
  const pagination = paginate(req);
  const raw = req.query["userId"];
  // A blank userId is the panel's "all users" option, not a bad filter.
  const owner = raw === undefined || raw === "" ? undefined : objectId(raw);

  // An unusable filter value yields an empty page instead of a cast error.
  if (owner === null) {
    res.json(paginated([], 0, pagination));
    return;
  }

  const filter = owner ? { owner } : {};
  const [data, total] = await Promise.all([
    Note.find(filter)
      .populate("owner", "name")
      .sort({ _id: -1 })
      .skip(pagination.skip)
      .limit(pagination.limit)
      .lean(),
    Note.countDocuments(filter),
  ]);

  res.json(paginated(data, total, pagination));
});

// The admin reads and writes every note, so these four take no owner filter --
// that pattern belongs to the user routes, where it is the authorization check.
// Here the admin token is the authorization and the note id alone selects the row.

export const getNote = asyncHandler<AdminRequest<unknown, IdParams>>(async (req, res) => {
  const id = objectId(req.params.id);
  if (!id) throw notFoundError();

  const note = await Note.findById(id).populate("owner", "name").lean();
  if (!note) throw notFoundError();

  res.json(note);
});

export const createNote = asyncHandler<ValidatedRequest<typeof adminNoteCreateSchema>>(
  async (req, res) => {
    const { title, content, ownerId } = req.body;
    const owner = objectId(ownerId);
    if (!owner) throw notFoundError();

    if (!(await User.exists({ _id: owner }))) throw notFoundError();

    const note = await Note.create({ title, content, owner });
    res.status(201).json(note.toObject());
  },
);

export const updateNote = asyncHandler<ValidatedRequest<typeof adminNoteUpdateSchema, IdParams>>(
  async (req, res) => {
    const id = objectId(req.params.id);
    if (!id) throw notFoundError();

    const { title, content } = req.body;
    const note = await Note.findByIdAndUpdate(
      id,
      { title, content },
      { returnDocument: "after", runValidators: true },
    ).lean();
    if (!note) throw notFoundError();

    res.json(note);
  },
);

export const deleteNote = asyncHandler<AdminRequest<unknown, IdParams>>(async (req, res) => {
  const id = objectId(req.params.id);
  if (!id) throw notFoundError();

  const note = await Note.findByIdAndDelete(id).lean();
  if (!note) throw notFoundError();

  res.status(204).end();
});
