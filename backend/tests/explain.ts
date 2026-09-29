import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose, { Types } from "mongoose";
import { Note } from "../src/models/Note.js";
import { Post } from "../src/models/Post.js";
import { User } from "../src/models/User.js";

const stage = (plan: Record<string, unknown>): string => JSON.stringify(plan.executionStats ?? plan, null, 2);

const run = async (): Promise<void> => {
  const mongod = await MongoMemoryServer.create();
  await mongoose.connect(mongod.getUri());

  const owner = await User.create({ name: "Owner", email: "owner@example.com", password: "password1", interests: ["reading", "music"] });
  await User.create({ name: "Other", email: "other@example.com", password: "password1", interests: ["reading"] });
  await Note.create({ title: "N", content: "c", owner: owner._id });
  await Post.create({ title: "P", body: "b", author: owner._id });

  const report: string[] = ["# Explain report", ""];

  report.push("## User login lookup — `{ email: 1 }` unique index", "");
  report.push(
    "```json\n" +
      stage(await User.findOne({ email: "owner@example.com" }).select("+password").explain("executionStats")) +
      "\n```",
    "",
  );

  report.push("## User's own note list — `{ owner: 1, _id: -1 }` index", "");
  report.push(
    "```json\n" +
      stage(await Note.find({ owner: owner._id }).sort({ _id: -1 }).explain("executionStats")) +
      "\n```",
    "",
  );

  report.push("## Post feed by author — `{ author: 1, _id: -1 }` index", "");
  report.push(
    "```json\n" +
      stage(await Post.find({ author: owner._id }).sort({ _id: -1 }).explain("executionStats")) +
      "\n```",
    "",
  );

  report.push("## Aggregation: users grouped by interests", "");
  const interestsExplain = await User.aggregate([
    { $unwind: "$interests" },
    { $group: { _id: "$interests", count: { $sum: 1 }, users: { $push: { _id: "$_id", name: "$name", email: "$email" } } } },
    { $sort: { count: -1, _id: 1 } },
    { $project: { _id: 0, interest: "$_id", count: 1, users: 1 } },
  ]).explain("executionStats");
  report.push("```json\n" + JSON.stringify(interestsExplain, null, 2) + "\n```", "");

  report.push("## Aggregation: posts by author ($lookup + $facet)", "");
  const postsExplain = await User.aggregate([
    { $match: { _id: owner._id as unknown as Types.ObjectId } },
    {
      $lookup: {
        from: "posts",
        let: { authorId: "$_id" },
        pipeline: [
          { $match: { $expr: { $eq: ["$author", "$$authorId"] } } },
          { $facet: { data: [{ $sort: { _id: -1 } }, { $skip: 0 }, { $limit: 10 }], total: [{ $count: "count" }] } },
        ],
        as: "posts",
      },
    },
    { $project: { _id: 0, name: 1, posts: 1 } },
  ]).explain("executionStats");
  report.push("```json\n" + JSON.stringify(postsExplain, null, 2) + "\n```", "");

  process.stdout.write(report.join("\n"));

  await mongoose.disconnect();
  await mongod.stop();
};

run().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
