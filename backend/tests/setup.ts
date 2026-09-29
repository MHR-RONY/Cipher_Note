import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { afterAll, afterEach, beforeAll } from "vitest";

process.env["USER_JWT_SECRET"] ??= "test-user-secret";
process.env["ADMIN_JWT_SECRET"] ??= "test-admin-secret";
process.env["ADMIN_SETUP_KEY"] ??= "test-setup-key";
process.env["USER_PANEL_URL"] ??= "http://localhost:8080";
process.env["ADMIN_PANEL_URL"] ??= "http://localhost:8080";

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
  mongoose.set("strictQuery", true);
  await mongoose.connect(mongod.getUri());
}, 60_000);

afterEach(async () => {
  const { collections } = mongoose.connection;
  await Promise.all(Object.values(collections).map((collection) => collection.deleteMany({})));
});

afterAll(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});
