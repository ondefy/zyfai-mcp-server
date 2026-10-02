import jwt from "jsonwebtoken";
import { config } from "../config/env.js";

export type McpAccessTokenPayload = {
  sub: string;
  eoa: string;
  scope: string;
  sid: string;
  aud?: string;
  client_id?: string;
};

export function verifyMcpAccessToken(
  token: string,
): McpAccessTokenPayload {
  const secret = config.mcpOAuthJwtSecret;
  if (!secret) {
    throw new Error("MCP_OAUTH_JWT_SECRET is not configured");
  }
  const payload = jwt.verify(token, secret) as McpAccessTokenPayload & {
    zyfai_access_token?: string;
  };
  if (
    !payload.sub ||
    !payload.eoa ||
    !payload.sid ||
    payload.zyfai_access_token
  ) {
    throw new Error("Invalid MCP token claims");
  }
  if (
    config.mcpResourceUrl &&
    (!payload.aud ||
      (payload.aud !== config.mcpResourceUrl &&
        payload.aud !== `${config.mcpResourceUrl.replace(/\/$/, "")}/mcp` &&
        payload.aud !== config.mcpResourceUrl.replace(/\/$/, "")))
  ) {
    throw new Error("MCP token audience mismatch");
  }
  return payload;
}
