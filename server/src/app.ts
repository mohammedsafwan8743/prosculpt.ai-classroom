import express from "express";
import cors from "cors";
import helmet from "helmet";
import { env } from "./config/env.js";
import { errorHandler } from "./middleware/errorHandler.js";

// Module routes
import authRoutes from "./modules/auth/auth.routes.js";
import classroomRoutes from "./modules/classroom/classroom.routes.js";
import notificationRoutes from "./modules/notification/notification.routes.js";
import livekitRoutes from "./modules/livekit/livekit.routes.js";

const app = express();

/* ── Security ── */
// Disable Helmet in serverless (Vercel) — it adds headers that interfere
// with serverless function responses and Vercel handles security headers itself.
if (!process.env.VERCEL) {
  app.use(helmet());
}
app.use(
  cors({
    origin: process.env.VERCEL
      ? true  // Allow all origins on Vercel (same domain, serverless)
      : env.CORS_ORIGIN,
    credentials: true,
  })
);

/* ── Body Parsing ── */
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));

/* ── Health Check ── */
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: env.NODE_ENV,
  });
});

/* ── API Routes ── */
app.use("/api/auth", authRoutes);
app.use("/api/classrooms", classroomRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/livekit", livekitRoutes);

/* ── 404 for unknown API routes ── */
app.use("/api/*", (_req, res) => {
  res.status(404).json({ error: "API endpoint not found" });
});

/* ── Global Error Handler ── */
app.use(errorHandler);

export default app;
