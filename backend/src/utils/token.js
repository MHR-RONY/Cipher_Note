import jwt from "jsonwebtoken";

export const signUserToken = (id) =>
  jwt.sign({ sub: String(id), role: "user" }, process.env.USER_JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "1d",
  });

export const signAdminToken = (id) =>
  jwt.sign({ sub: String(id), role: "admin" }, process.env.ADMIN_JWT_SECRET, {
    algorithm: "HS256",
    expiresIn: "2h",
  });

export const verifyUserToken = (token) =>
  jwt.verify(token, process.env.USER_JWT_SECRET, { algorithms: ["HS256"] });

export const verifyAdminToken = (token) =>
  jwt.verify(token, process.env.ADMIN_JWT_SECRET, { algorithms: ["HS256"] });
