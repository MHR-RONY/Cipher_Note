import { describe, expect, it } from "vitest";
import { agent, registerUser } from "./helpers.js";

describe("note ownership", () => {
  it("returns 404, not another user's note, when the note belongs to someone else", async () => {
    const owner = await registerUser({ email: "owner@example.com" });
    const stranger = await registerUser({ email: "stranger@example.com" });

    const created = await agent
      .post("/api/user/notes")
      .set("Authorization", `Bearer ${owner.token}`)
      .send({ title: "Private", content: "secret" });
    expect(created.status).toBe(201);

    const res = await agent
      .get(`/api/user/notes/${created.body._id}`)
      .set("Authorization", `Bearer ${stranger.token}`);
    expect(res.status).toBe(404);
  });

  it("returns 404 for an invalid ObjectId without a DB error", async () => {
    const { token } = await registerUser({ email: "invalidid@example.com" });
    const res = await agent.get("/api/user/notes/not-an-id").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(404);
  });

  it("lists, updates and deletes only the caller's own notes", async () => {
    const { token } = await registerUser({ email: "crud@example.com" });
    const created = await agent
      .post("/api/user/notes")
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "First", content: "one" });

    const updated = await agent
      .put(`/api/user/notes/${created.body._id}`)
      .set("Authorization", `Bearer ${token}`)
      .send({ title: "First (edited)", content: "one edited" });
    expect(updated.status).toBe(200);
    expect(updated.body.title).toBe("First (edited)");

    const list = await agent.get("/api/user/notes").set("Authorization", `Bearer ${token}`);
    expect(list.body.data).toHaveLength(1);
    expect(list.body.pagination.total).toBe(1);

    const deleted = await agent
      .delete(`/api/user/notes/${created.body._id}`)
      .set("Authorization", `Bearer ${token}`);
    expect(deleted.status).toBe(204);
  });
});

describe("pagination defaults", () => {
  it("defaults to a limit of 10 and caps at 50", async () => {
    const { token } = await registerUser({ email: "paginate@example.com" });
    await Promise.all(
      Array.from({ length: 15 }, (_, i) =>
        agent.post("/api/user/notes").set("Authorization", `Bearer ${token}`).send({ title: `Note ${i}`, content: "x" }),
      ),
    );

    const defaultPage = await agent.get("/api/user/notes").set("Authorization", `Bearer ${token}`);
    expect(defaultPage.body.pagination.limit).toBe(10);
    expect(defaultPage.body.data).toHaveLength(10);

    const overLimit = await agent.get("/api/user/notes?limit=999").set("Authorization", `Bearer ${token}`);
    expect(overLimit.body.pagination.limit).toBe(50);
  });
});
