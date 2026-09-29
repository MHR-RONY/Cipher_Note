import { asyncHandler } from "../utils/asyncHandler.js";
import { notFoundError } from "../utils/httpError.js";
import { objectId } from "../utils/objectId.js";
import { paginate, paginated } from "../utils/paginate.js";
import { User, type UserDoc } from "../models/User.js";
import type { PostDoc } from "../models/Post.js";

interface InterestGroup {
  interest: string;
  count: number;
  users: Pick<UserDoc, "_id" | "name" | "email">[];
}

interface PostsFacet {
  data: PostDoc[];
  total: { count: number }[];
}

interface AuthorPostsRow {
  name: string;
  posts: PostsFacet[];
}

export const usersGroupedByInterests = asyncHandler(async (_req, res) => {
  res.json({
    data: await User.aggregate<InterestGroup>([
      { $unwind: "$interests" },
      {
        $group: {
          _id: "$interests",
          count: { $sum: 1 },
          users: { $push: { _id: "$_id", name: "$name", email: "$email" } },
        },
      },
      { $sort: { count: -1, _id: 1 } },
      { $project: { _id: 0, interest: "$_id", count: 1, users: 1 } },
    ]),
  });
});

export const postsByAuthor = asyncHandler(async (req, res) => {
  // Aggregation does not cast strings, so the id must already be an ObjectId here.
  const id = objectId(req.params["id"]);
  if (!id) throw notFoundError();

  const pagination = paginate(req);
  const { skip, limit } = pagination;

  const [row] = await User.aggregate<AuthorPostsRow>([
    { $match: { _id: id } },
    {
      $lookup: {
        from: "posts",
        let: { authorId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$author", "$$authorId"] } } },
          {
            $facet: {
              data: [{ $sort: { _id: -1 } }, { $skip: skip }, { $limit: limit }],
              total: [{ $count: "count" }],
            },
          },
        ],
        as: "posts",
      },
    },
    { $project: { _id: 0, name: 1, posts: 1 } },
  ]);

  if (!row) throw notFoundError();

  const facet = row.posts[0];
  res.json({ name: row.name, ...paginated(facet?.data ?? [], facet?.total[0]?.count ?? 0, pagination) });
});
