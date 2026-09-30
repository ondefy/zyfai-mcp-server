import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export type McpAccessTokenPayload = {
  sub: string;
  eoa: string;
  scope: string;
  zyfai_access_token: string;
  aud?: string;
};

export function verifyMcpAccessToken(
  token: string,
): McpAccessTokenPayload {
  const secret = config.mcpOAuthJwtSecret;
  if (!secret) {
    throw new Error("MCP_OAUTH_JWT_SECRET is not configured");
  }
  const payload = jwt.verify(token, secret) as McpAccessTokenPayload;
  if (!payload.sub || !payload.eoa || !payload.zyfai_access_token) {
    throw new Error("Invalid MCP token claims");
  }
  if (
    config.mcpResourceUrl &&
    payload.aud &&
    payload.aud !== config.mcpResourceUrl
  ) {
    throw new Error("MCP token audience mismatch");
  }
  return payload;
}
