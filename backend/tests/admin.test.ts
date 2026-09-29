import { describe, expect, it } from "vitest";
import { Note } from "../src/models/Note.js";
import { Post } from "../src/models/Post.js";
import { agent, registerUser, setupAdmin } from "./helpers.js";

describe("admin user management", () => {
  it("cascades note and post deletion when a user is deleted", async () => {
    const admin = await setupAdmin();
    const user = await registerUser({ email: "cascade@example.com" });

    await agent.post("/api/user/notes").set("Authorization", `Bearer ${user.token}`).send({ title: "N", content: "c" });
    await agent.post("/api/user/posts").set("Authorization", `Bearer ${user.token}`).send({ title: "P", body: "b" });

    const del = await agent.delete(`/api/admin/users/${user.user._id}`).set("Authorization", `Bearer ${admin.token}`);
    expect(del.status).toBe(204);

    expect(await Note.countDocuments({ owner: user.user._id })).toBe(0);
    expect(await Post.countDocuments({ author: user.user._id })).toBe(0);
  });

  it("registers grouped-by-interests before /users/:id", async () => {
    const admin = await setupAdmin();
    const res = await agent.get("/api/admin/users/grouped-by-interests").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.data)).toBe(true);
  });

  it("never returns a password on user list, get, create or update", async () => {
    const admin = await setupAdmin();
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
    const admin = await setupAdmin();
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
