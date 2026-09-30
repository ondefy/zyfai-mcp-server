import { NextFunction, Request, Response } from "express";
import type { McpRequestAuth } from "../auth/request-context.js";
import { verifyMcpAccessToken } from "../auth/mcp-token.js";
import { config } from "../config/env.js";

export type RequestWithMcpAuth = Request & { mcpAuth?: McpRequestAuth };

export function wwwAuthenticateHeader(): string {
  const resourceMetadata = `${config.mcpResourceUrl}/.well-known/oauth-protected-resource`;
  return `Bearer realm="zyfai-mcp", resource_metadata="${resourceMetadata}"`;
}

function unauthorized(
  res: Response,
  message: string,
) {
  res.setHeader("WWW-Authenticate", wwwAuthenticateHeader());
  return res.status(401).json({
    error: "unauthorized",
    message,
  });
}

/**
 * MCP_AUTH_REQUIRED controls whether a bearer is mandatory.
 * A supplied bearer is always validated and attached as user context.
 * No bearer plus auth required is 401. No bearer plus auth optional stays anonymous.
 */
export function mcpAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    if (!config.mcpAuthRequired) {
      return next();
    }
    return unauthorized(res, "Missing or invalid Authorization bearer token");
  }

  const token = header.slice("Bearer ".length).trim();
  if (!token) {
    return unauthorized(res, "Missing or invalid Authorization bearer token");
  }

  try {
    const payload = verifyMcpAccessToken(token);
    (req as RequestWithMcpAuth).mcpAuth = {
      userId: payload.sub,
      eoa: payload.eoa,
      scope: payload.scope || "mcp:tools:read",
      sessionId: payload.sid,
      clientId: payload.client_id || "unknown-client",
      mcpAccessToken: token,
    };
    return next();
  } catch (error) {
    return unauthorized(
      res,
      error instanceof Error ? error.message : "Invalid token",
    );
  }
}
