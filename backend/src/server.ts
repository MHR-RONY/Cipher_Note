import "dotenv/config";
import app from "./app.js";
import { connectDb } from "./config/db.js";
import { assertJwtSecrets } from "./utils/token.js";

const required = (key: "MONGO_URI"): string => {
  const value = process.env[key];
  if (!value) throw new Error(`${key} is not set`);
  return value;
};

const start = async (): Promise<void> => {
  assertJwtSecrets();
  await connectDb(required("MONGO_URI"));

  const port = Number(process.env["PORT"] ?? 5000);
  app.listen(port, () => {
    console.log(`API listening on ${port}`);
  });
};

start().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
