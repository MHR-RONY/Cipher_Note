import type { Request } from "express";
import jwt, { type SignOptions } from "jsonwebtoken";

export type Role = "user" | "admin";

export interface TokenPayload {
  sub: string;
  role: Role;
}

type SecretKey = "USER_JWT_SECRET" | "ADMIN_JWT_SECRET";

const secret = (key: SecretKey): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set`);
  return value;
};

export const assertJwtSecrets = (): void => {
  secret("USER_JWT_SECRET");
  secret("ADMIN_JWT_SECRET");
};

type ExpiresIn = NonNullable<SignOptions["expiresIn"]>;

const sign = (id: string, role: Role, key: SecretKey, expiresIn: ExpiresIn): string =>
  jwt.sign({ sub: id, role }, secret(key), { algorithm: "HS256", expiresIn });

const verify = (token: string | null | undefined, key: SecretKey, role: Role): TokenPayload | null => {
  if (!token) return null;
  try {
    const decoded = jwt.verify(token, secret(key), { algorithms: ["HS256"] });
    if (typeof decoded === "string" || typeof decoded.sub !== "string" || decoded.role !== role) {
      return null;
    }
    return { sub: decoded.sub, role };
  } catch {
    return null;
  }
};

export const signUserToken = (id: string): string => sign(id, "user", "USER_JWT_SECRET", "1d");
export const signAdminToken = (id: string): string => sign(id, "admin", "ADMIN_JWT_SECRET", "2h");

export const verifyUserToken = (token: string | null | undefined): TokenPayload | null =>
  verify(token, "USER_JWT_SECRET", "user");

export const verifyAdminToken = (token: string | null | undefined): TokenPayload | null =>
  verify(token, "ADMIN_JWT_SECRET", "admin");

export const bearerToken = (req: Request): string | null => {
  const header = req.headers.authorization;
  if (header === undefined || !header.startsWith("Bearer ")) return null;
  return header.slice("Bearer ".length).trim() || null;
};
