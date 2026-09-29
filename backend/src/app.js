import express from "express";
import helmet from "helmet";
import cors from "cors";
import userRoutes from "./routes/user/index.js";
import adminRoutes from "./routes/admin/index.js";
import { authLimiter, setupLimiter } from "./middleware/rateLimit.js";
import { notFound, errorHandler } from "./middleware/error.js";

// Read the panel URL per request so import order never decides CORS.
const panelCors = (envKey) =>
  cors({ origin: (_origin, cb) => cb(null, process.env[envKey]), credentials: true });

const app = express();

app.disable("x-powered-by");
app.use(helmet());
app.use(express.json({ limit: "10kb" }));

app.post("/api/user/auth/login", authLimiter);
app.post("/api/user/auth/register", authLimiter);
app.post("/api/admin/auth/login", authLimiter);
app.post("/api/admin/setup", setupLimiter);

app.use("/api/user", panelCors("USER_PANEL_URL"), userRoutes);
app.use("/api/admin", panelCors("ADMIN_PANEL_URL"), adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
