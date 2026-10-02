/**
 * Express + MCP app factory (HTTP entry and integration tests).
 */

import cors from "cors";
import express, { type Express } from "express";

import { config } from "./config/env.js";
import {
  errorHandler,
  notFoundHandler,
  requestLogger,
} from "./middleware/index.js";
import { createOAuthRoutes } from "./routes/oauth.routes.js";
import { setupRoutes } from "./routes/http.routes.js";
import { ZyfaiApiService } from "./services/zyfai-api.service.js";

export type McpApp = {
  app: Express;
  zyfaiApi: ZyfaiApiService;
};

export function createApp(): McpApp {
  const zyfaiApi = new ZyfaiApiService();

  const app = express();

  app.use(express.json());
  app.use(
    cors({
      origin: config.allowedOrigins,
      credentials: true,
      exposedHeaders: ["Mcp-Session-Id"],
    }),
  );

  app.use(requestLogger);
  app.use(createOAuthRoutes());

  app.use(setupRoutes(zyfaiApi));

  app.use(errorHandler);
  app.use(notFoundHandler);

  return { app, zyfaiApi };
}
