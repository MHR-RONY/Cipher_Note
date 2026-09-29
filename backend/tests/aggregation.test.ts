import { describe, expect, it } from "vitest";
import { agent, registerUser, setupAdmin } from "./helpers.js";

describe("aggregation: users grouped by interests", () => {
  it("groups, counts and sorts by count desc then interest", async () => {
    const admin = await setupAdmin();
    await registerUser({ email: "i1@example.com", interests: ["reading", "music"] });
    await registerUser({ email: "i2@example.com", interests: ["reading"] });
    await registerUser({ email: "i3@example.com", interests: ["music"] });

    const res = await agent.get("/api/admin/users/grouped-by-interests").set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    // Both interests tie at count 2, so the { count: -1, _id: 1 } sort breaks
    // the tie alphabetically: "music" sorts before "reading".
    expect(res.body.data[0].interest).toBe("music");
    expect(res.body.data[0].count).toBe(2);
    expect(res.body.data[0].users[0]).toHaveProperty("email");
    expect(res.body.data[0].users[0].password).toBeUndefined();
  });
});

describe("aggregation: posts by author (admin)", () => {
  it("paginates one member's posts and returns their name", async () => {
    const admin = await setupAdmin();
    const user = await registerUser({ email: "author@example.com" });
    await Promise.all(
      Array.from({ length: 3 }, (_, i) =>
        agent.post("/api/user/posts").set("Authorization", `Bearer ${user.token}`).send({ title: `Post ${i}`, body: "b" }),
      ),
    );

    const res = await agent
      .get(`/api/admin/users/${user.user._id}/posts?limit=2`)
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(200);
    expect(res.body.name).toBe("Test User");
    expect(res.body.data).toHaveLength(2);
    expect(res.body.pagination.total).toBe(3);
  });

  it("returns 404 for a user that does not exist", async () => {
    const admin = await setupAdmin();
    const res = await agent
      .get("/api/admin/users/64b000000000000000000000/posts")
      .set("Authorization", `Bearer ${admin.token}`);
    expect(res.status).toBe(404);
  });
});
