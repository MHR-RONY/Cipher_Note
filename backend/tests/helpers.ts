import request from "supertest";
import app from "../src/app.js";
import { Admin } from "../src/models/Admin.js";
import { signAdminToken } from "../src/utils/token.js";

export const agent = request(app);

// Goes through the real HTTP setup route, so it is subject to setupLimiter (5/hour).
// Only tests that assert on the setup route itself should use this; anything that
// just needs an admin session should use adminSession() below, or the suite runs
// out of setup attempts and every later admin token comes back undefined.
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

// Creates the admin straight through the model and signs a token, bypassing the
// rate-limited setup route. Same end state -- an Admin row plus a valid token.
export const adminSession = async (): Promise<{ token: string; admin: { _id: string } }> => {
  const admin = await Admin.create({ name: "Ada Admin", email: "ada@example.com", password: "adminpass1" });
  const _id = admin._id.toString();
  return { token: signAdminToken(_id), admin: { _id } };
};
