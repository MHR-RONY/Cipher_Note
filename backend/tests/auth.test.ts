import { describe, expect, it } from "vitest";
import { agent, registerUser, setupAdmin } from "./helpers.js";

describe("user auth", () => {
  it("registers and returns a token plus a public user", async () => {
    const res = await agent.post("/api/user/auth/register").send({
      name: "Lee Chen",
      email: "lee@example.com",
      password: "password1",
      interests: ["reading"],
    });
    expect(res.status).toBe(201);
    expect(res.body.token).toBeTypeOf("string");
    expect(res.body.user.email).toBe("lee@example.com");
    expect(res.body.user.password).toBeUndefined();
  });

  it("logs in with the right password", async () => {
    await registerUser({ email: "login@example.com", password: "password1" });
    const res = await agent.post("/api/user/auth/login").send({ email: "login@example.com", password: "password1" });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeTypeOf("string");
  });

  it("returns the same generic message for a wrong password and an unknown email", async () => {
    await registerUser({ email: "known@example.com", password: "password1" });
    const wrongPassword = await agent.post("/api/user/auth/login").send({ email: "known@example.com", password: "wrong" });
    const unknownEmail = await agent.post("/api/user/auth/login").send({ email: "missing@example.com", password: "whatever1" });

    expect(wrongPassword.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongPassword.body.message).toBe("Invalid email or password");
    expect(unknownEmail.body.message).toBe(wrongPassword.body.message);
  });

  it("never returns the password field", async () => {
    const { token } = await registerUser({ email: "nopass@example.com" });
    const res = await agent.get("/api/user/auth/me").set("Authorization", `Bearer ${token}`);
    expect(res.body.user.password).toBeUndefined();
  });

  it("rejects /me with no token", async () => {
    const res = await agent.get("/api/user/auth/me");
    expect(res.status).toBe(401);
  });
});

describe("admin setup", () => {
  it("creates the admin once, then 404s on a second attempt", async () => {
    const first = await setupAdmin();
    expect(first.token).toBeTypeOf("string");

    const second = await agent.post("/api/admin/setup").send({
      name: "Second",
      email: "second@example.com",
      password: "password1",
      setupKey: process.env["ADMIN_SETUP_KEY"],
    });
    expect(second.status).toBe(404);
  });

  it("rejects a wrong setup key with 403", async () => {
    const res = await agent.post("/api/admin/setup").send({
      name: "Ada",
      email: "ada2@example.com",
      password: "password1",
      setupKey: "wrong-key",
    });
    expect(res.status).toBe(403);
  });

  it("reports required:false once an admin exists", async () => {
    await setupAdmin();
    const res = await agent.get("/api/admin/setup/status");
    expect(res.body.required).toBe(false);
  });

  it("logs the admin in and never returns the password", async () => {
    await setupAdmin();
    const res = await agent.post("/api/admin/auth/login").send({ email: "ada@example.com", password: "adminpass1" });
    expect(res.status).toBe(200);
    expect(res.body.admin.password).toBeUndefined();
  });
});

describe("cross-panel token rejection", () => {
  it("rejects a user token on an admin route", async () => {
    const { token } = await registerUser({ email: "cross1@example.com" });
    const res = await agent.get("/api/admin/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });

  it("rejects an admin token on a user route", async () => {
    const { token } = await setupAdmin();
    const res = await agent.get("/api/user/notes").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
