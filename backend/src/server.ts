import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";

import { config } from "./config.js";
import { logger } from "./logger.js";

import authRoutes from "./routes/auth.js";
import staffRoutes from "./routes/staff.js";
import userRoutes from "./routes/users.js";
import docRoutes from "./routes/documents.js";
import auditRoutes from "./routes/audit.js";

const app = express();

app.use(pinoHttp({ logger }));
app.use(helmet());
app.use(cors({ origin: config.corsOrigin, credentials: true }));
app.use(express.json({ limit: "2mb" }));
app.use(cookieParser());

app.use("/api", rateLimit({ windowMs: 60_000, limit: 300 }));
app.use("/api/auth", rateLimit({ windowMs: 60_000, limit: 20 }));

app.get("/api/health", (_req, res) => res.json({ ok: true }));

app.use("/api/auth", authRoutes);
app.use("/api/staff", staffRoutes);
app.use("/api/users", userRoutes);
app.use("/api/docs", docRoutes);
app.use("/api/audit", auditRoutes);

app.use("/files", express.static(config.localUploadDir));

app.use((err: any, _req: any, res: any, _next: any) => {
  logger.error({ err }, "unhandled error");
  res.status(500).json({ message: "Internal server error" });
});

app.listen(config.port, () => logger.info(`Backend listening on :${config.port}`));
