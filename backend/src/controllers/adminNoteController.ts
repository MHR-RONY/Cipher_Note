import { Note } from "../models/Note.js";
import type { AdminRequest } from "../middleware/authAdmin.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { objectId } from "../utils/objectId.js";
import { paginate, paginated } from "../utils/paginate.js";

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
