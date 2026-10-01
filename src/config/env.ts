/**
 * Environment Configuration
 * Centralized environment variable management
 */

import { config as loadDotenv } from "dotenv";

loadDotenv();

import type { BackendEnvironment } from "@zyfai/sdk";
import { normalizeZyfaiWebSigningBase } from "./normalize-signing-base.js";

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

  /**
   * When true, every /mcp request needs a bearer.
   * When false, a missing bearer is anonymous. A supplied bearer is still validated.
   */
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

  /** zyf.ai origin for agent deposit signing pages (prepare_deposit signingUrl). */
  zyfaiWebSigningBase: normalizeZyfaiWebSigningBase(
    process.env.ZYFAI_WEB_SIGNING_BASE,
  ),

  /** When true, register financial write tools (deposit/register/configure). Default off for public plugin. */
  mcpWriteToolsEnabled:
    process.env.MCP_WRITE_TOOLS_ENABLED === "1" ||
    process.env.MCP_WRITE_TOOLS_ENABLED === "true",

  /** Legacy catalog tool for integration tests only. */
  mcpRegisterLegacyProtocolTools:
    process.env.MCP_REGISTER_LEGACY_PROTOCOL_TOOLS === "1" ||
    process.env.MCP_REGISTER_LEGACY_PROTOCOL_TOOLS === "true",

  /** OpenAI domain verification token (plain text response). */
  openaiAppsChallengeToken: process.env.OPENAI_APPS_CHALLENGE_TOKEN,

  mcpAppsEnabled:
    process.env.MCP_APPS_ENABLED === "1" ||
    process.env.MCP_APPS_ENABLED === "true",
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
