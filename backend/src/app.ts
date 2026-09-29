import cors from "cors";
import express, { type Express, type RequestHandler, type Router } from "express";
import helmet from "helmet";
import { errorHandler, notFound } from "./middleware/error.js";
import { loginLimiter, registerLimiter, setupLimiter } from "./middleware/rateLimit.js";
import adminRoutes from "./routes/admin/index.js";
import userRoutes from "./routes/user/index.js";

type PanelUrlKey = "USER_PANEL_URL" | "ADMIN_PANEL_URL";

// Read the panel URL per request so import order never decides CORS.
const panelCors = (key: PanelUrlKey): RequestHandler =>
  cors({ origin: (_origin, cb) => cb(null, process.env[key] ?? false), credentials: true });

// CORS is registered before the limiters so a 429 still carries
// Access-Control-Allow-Origin and the browser can read the throttle message (bug B1).
const panel = (key: PanelUrlKey, limiters: [string, RequestHandler][], routes: Router): Router => {
  const router = express.Router();
  router.use(panelCors(key));
  for (const [path, limiter] of limiters) router.post(path, limiter);
  router.use(routes);
  return router;
};

export const createApp = (): Express => {
  const app = express();

  app.disable("x-powered-by");
  app.use(helmet());
  app.use(express.json({ limit: "10kb" }));

  // Outside both panel routers: no auth, no rate limit, and no panel CORS, since
  // this is for uptime probes rather than browser code.
  app.get("/api/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.use(
    "/api/user",
    panel(
      "USER_PANEL_URL",
      [
        ["/auth/login", loginLimiter],
        ["/auth/register", registerLimiter],
      ],
      userRoutes,
    ),
  );

  app.use(
    "/api/admin",
    panel(
      "ADMIN_PANEL_URL",
      [
        ["/auth/login", loginLimiter],
        ["/setup", setupLimiter],
      ],
      adminRoutes,
    ),
  );

  app.use(notFound);
  app.use(errorHandler);

  return app;
};

export default createApp();
