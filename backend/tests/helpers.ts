import request from "supertest";
import app from "../src/app.js";

export const agent = request(app);

export const setupAdmin = async () => {
  const res = await agent.post("/api/admin/setup").send({
    name: "Ada Admin",
    email: "ada@example.com",
    password: "adminpass1",
    setupKey: process.env["ADMIN_SETUP_KEY"],
  });
  return res.body as { token: string; admin: { _id: string } };
};

export const registerUser = async (overrides: Partial<{ name: string; email: string; password: string; interests: string[] }> = {}) => {
  const res = await agent.post("/api/user/auth/register").send({
    name: "Test User",
    email: "user@example.com",
    password: "userpass1",
    interests: [],
    ...overrides,
  });
  return res.body as { token: string; user: { _id: string } };
};
