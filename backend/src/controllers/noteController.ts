import type { z } from "zod";
import type { AuthedRequest } from "../middleware/authUser.js";
import { Note } from "../models/Note.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { notFoundError } from "../utils/httpError.js";
import { objectId } from "../utils/objectId.js";
import { paginate, paginated } from "../utils/paginate.js";
import type { noteSchema } from "../validators/user.js";

type NoteBody = z.infer<typeof noteSchema>;
type IdParams = { id: string };

export const listNotes = asyncHandler<AuthedRequest>(async (req, res) => {
  const pagination = paginate(req);
  const filter = { owner: req.user._id };

  const [data, total] = await Promise.all([
    Note.find(filter).sort({ _id: -1 }).skip(pagination.skip).limit(pagination.limit).lean(),
    Note.countDocuments(filter),
  ]);

  res.json(paginated(data, total, pagination));
});

export const createNote = asyncHandler<AuthedRequest<NoteBody>>(async (req, res) => {
  const { title, content } = req.body;
  const note = await Note.create({ title, content, owner: req.user._id });
  res.status(201).json(note.toObject());
});

export const getNote = asyncHandler<AuthedRequest<unknown, IdParams>>(async (req, res) => {
  const id = objectId(req.params.id);
  if (!id) throw notFoundError();

  const note = await Note.findOne({ _id: id, owner: req.user._id }).lean();
  if (!note) throw notFoundError();

  res.json(note);
});

export const updateNote = asyncHandler<AuthedRequest<NoteBody, IdParams>>(async (req, res) => {
  const id = objectId(req.params.id);
  if (!id) throw notFoundError();

  const { title, content } = req.body;
  const note = await Note.findOneAndUpdate(
    { _id: id, owner: req.user._id },
    { title, content },
    { new: true, runValidators: true },
  ).lean();
  if (!note) throw notFoundError();

  res.json(note);
});

export const deleteNote = asyncHandler<AuthedRequest<unknown, IdParams>>(async (req, res) => {
  const id = objectId(req.params.id);
  if (!id) throw notFoundError();

  const note = await Note.findOneAndDelete({ _id: id, owner: req.user._id }).lean();
  if (!note) throw notFoundError();

  res.status(204).send();
});
