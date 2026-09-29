import { Types } from "mongoose";
import { describe, expect, it } from "vitest";
import { Note } from "../src/models/Note.js";
import { Post } from "../src/models/Post.js";
import { adminSession, agent, registerUser } from "./helpers.js";

describe("admin user management", () => {
  it("cascades note and post deletion when a user is deleted", async () => {
    const admin = await adminSession();
    const user = await registerUser({ email: "cascade@example.com" });

    await agent.post("/api/user/notes").set("Authorization", `Bearer ${user.token}`).send({ title: "N", content: "c" });
    await agent.post("/api/user/posts").set("Authorization", `Bearer ${user.token}`).send({ title: "P", body: "b" });

    const del = await agent.delete(`/api/admin/users/${user.user._id}`).set("Authorization", `Bearer ${admin.token}`);
    expect(del.status).toBe(204);

    expect(await Note.countDocuments({ owner: user.user._id })).toBe(0);
    expect(await Post.countDocuments({ author: user.user._id })).toBe(0);
  });

  it("registers grouped-by-interests before /users/:id", async () => {
    const admin = await adminSession();
    const res = await agent.get("/api/admin/users/grouped-by-interests").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("never returns a password on user list, get, create or update", async () => {
    const admin = await adminSession();
    const created = await agent
      .post("/api/admin/users")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "New", email: "new@example.com", password: "password1", interests: [] });
    expect(created.body.user.password).toBeUndefined();

    const updated = await agent
      .put(`/api/admin/users/${created.body.user._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ name: "Renamed", email: "new@example.com", interests: [] });
    expect(updated.status).toBe(200);
    expect(updated.body.user.password).toBeUndefined();

    const list = await agent.get("/api/admin/users").set("Authorization", `Bearer ${admin.token}`);
    expect(list.body.data.every((u: { password?: string }) => u.password === undefined)).toBe(true);
  });
});

describe("admin notes", () => {
  it("filters all-notes by userId", async () => {
    const admin = await adminSession();
    const userA = await registerUser({ email: "a@example.com" });
    const userB = await registerUser({ email: "b@example.com" });
    await agent.post("/api/user/notes").set("Authorization", `Bearer ${userA.token}`).send({ title: "A note", content: "x" });
    await agent.post("/api/user/notes").set("Authorization", `Bearer ${userB.token}`).send({ title: "B note", content: "y" });

    const filtered = await agent
      .get(`/api/admin/notes?userId=${userA.user._id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(filtered.body.data).toHaveLength(1);
    expect(filtered.body.data[0].title).toBe("A note");
  });
});

describe("admin note write access", () => {
  it("creates a note on behalf of a specified user and sets that user as owner", async () => {
    const admin = await adminSession();
    const user = await registerUser({ email: "onbehalf@example.com" });

    const created = await agent
      .post("/api/admin/notes")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ title: "From admin", content: "written for the member", ownerId: user.user._id });

    expect(created.status).toBe(201);
    expect(created.body.owner).toBe(user.user._id);

    // The note lands in that user's own list, so the owner ref is a real User id.
    const mine = await agent.get("/api/user/notes").set("Authorization", `Bearer ${user.token}`);
    expect(mine.body.data).toHaveLength(1);
    expect(mine.body.data[0].title).toBe("From admin");
  });

  it("returns 404 creating a note for an ownerId that does not exist", async () => {
    const admin = await adminSession();
    const res = await agent
      .post("/api/admin/notes")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ title: "Orphan", content: "x", ownerId: new Types.ObjectId().toString() });
    expect(res.status).toBe(404);
  });

  it("rejects a malformed ownerId with 400 before any lookup", async () => {
    const admin = await adminSession();
    const res = await agent
      .post("/api/admin/notes")
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ title: "Bad", content: "x", ownerId: "not-an-id" });
    expect(res.status).toBe(400);
  });

  it("reads, updates and deletes any user's note, with no owner filter", async () => {
    const admin = await adminSession();
    const user = await registerUser({ email: "anynote@example.com" });

    const created = await agent
      .post("/api/user/notes")
      .set("Authorization", `Bearer ${user.token}`)
      .send({ title: "Member's own", content: "mine" });

    const read = await agent
      .get(`/api/admin/notes/${created.body._id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(read.status).toBe(200);
    expect(read.body.title).toBe("Member's own");

    const updated = await agent
      .put(`/api/admin/notes/${created.body._id}`)
      .set("Authorization", `Bearer ${admin.token}`)
      .send({ title: "Edited by admin", content: "changed" });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe("Edited by admin");
    // Ownership is untouched by an admin edit.
    expect(String(updated.body.owner)).toBe(user.user._id);

    const removed = await agent
      .delete(`/api/admin/notes/${created.body._id}`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(removed.status).toBe(204);
    expect(await Note.countDocuments({ _id: created.body._id })).toBe(0);
  });

  it("rejects a user token on all four admin note-write routes", async () => {
    const { token } = await registerUser({ email: "notadmin@example.com" });
    const id = new Types.ObjectId().toString();

    const responses = await Promise.all([
      agent.post("/api/admin/notes").set("Authorization", `Bearer ${token}`).send({ title: "x", content: "y", ownerId: id }),
      agent.get(`/api/admin/notes/${id}`).set("Authorization", `Bearer ${token}`),
      agent.put(`/api/admin/notes/${id}`).set("Authorization", `Bearer ${token}`).send({ title: "x", content: "y" }),
      agent.delete(`/api/admin/notes/${id}`).set("Authorization", `Bearer ${token}`),
    ]);

    expect(responses.map((res) => res.status)).toEqual([401, 401, 401, 401]);
  });

  it("returns 404 for an invalid note id on get, update and delete", async () => {
    const admin = await adminSession();
    const auth = `Bearer ${admin.token}`;

    const responses = await Promise.all([
      agent.get("/api/admin/notes/not-an-id").set("Authorization", auth),
      agent.put("/api/admin/notes/not-an-id").set("Authorization", auth).send({ title: "x", content: "y" }),
      agent.delete("/api/admin/notes/not-an-id").set("Authorization", auth),
    ]);

    expect(responses.map((res) => res.status)).toEqual([404, 404, 404]);
  });
});
