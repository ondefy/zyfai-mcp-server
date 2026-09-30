/**
 * Environment Configuration
 * Centralized environment variable management
 */

import { config as loadDotenv } from "dotenv";

loadDotenv();

import type { BackendEnvironment } from "@zyfai/sdk";

function parseBackendEnvironment(): BackendEnvironment | undefined {
  const value = process.env.ZYFAI_BACKEND_ENV?.trim().toLowerCase();
  if (value === "local" || value === "staging" || value === "production") {
    return value;
  }
  return undefined;
}

export const config = {
  // Server configuration
  port: process.env.PORT ? parseInt(process.env.PORT) : 3005,
  host: process.env.HOST || "0.0.0.0",

  // CORS configuration
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["*"],

  // Zyfai API configuration
  zyfiApiKey: process.env.ZYFAI_API_KEY,

  /** local | staging | production — maps to SDK base URLs when explicit URLs are unset. */
  backendEnvironment: parseBackendEnvironment(),
  executionApiUrl: process.env.ZYFAI_EXECUTION_API_URL?.replace(/\/$/, ""),
  dataApiUrl: process.env.ZYFAI_DATA_API_URL?.replace(/\/$/, ""),

  /** When true, /mcp requires Authorization: Bearer (MCP OAuth JWT). */
  mcpAuthRequired:
    process.env.MCP_AUTH_REQUIRED === "1" ||
    process.env.MCP_AUTH_REQUIRED === "true",

  mcpResourceUrl:
    process.env.MCP_RESOURCE_URL?.replace(/\/$/, "") ||
    "https://mcp.zyf.ai",

  mcpOAuthJwtSecret:
    process.env.MCP_OAUTH_JWT_SECRET || process.env.AUTH_JWT_SECRET,

  mcpServerExchangeSecret: process.env.MCP_SERVER_EXCHANGE_SECRET,

  mcpAuthorizationServer:
    process.env.MCP_OAUTH_ISSUER?.replace(/\/$/, "") ||
    process.env.API_PUBLIC_URL?.replace(/\/$/, "") ||
    "https://api.zyf.ai",
} as const;

function isProductionNodeEnv(): boolean {
  const env = process.env.NODE_ENV?.toLowerCase();
  return env === "production" || env === "prod";
}

/** Fail fast when production MCP auth is misconfigured. */
export function assertProductionMcpConfig(): void {
  if (!isProductionNodeEnv()) {
    return;
  }
  if (!config.mcpAuthRequired) {
    throw new Error("MCP_AUTH_REQUIRED must be true in production");
  }
  if (!config.mcpOAuthJwtSecret) {
    throw new Error("MCP_OAUTH_JWT_SECRET is required in production");
  }
  if (!config.mcpServerExchangeSecret) {
    throw new Error("MCP_SERVER_EXCHANGE_SECRET is required in production");
  }
}
