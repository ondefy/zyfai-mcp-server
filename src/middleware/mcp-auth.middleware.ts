import { NextFunction, Request, Response } from "express";
import type { McpRequestAuth } from "../auth/request-context.js";
import { verifyMcpAccessToken } from "../auth/mcp-token.js";
import { config } from "../config/env.js";

export type RequestWithMcpAuth = Request & { mcpAuth?: McpRequestAuth };

function wwwAuthenticateHeader(): string {
  const resourceMetadata = `${config.mcpResourceUrl}/.well-known/oauth-protected-resource`;
  return `Bearer realm="zyfai-mcp", resource_metadata="${resourceMetadata}"`;
}

/**
 * Validates MCP OAuth bearer tokens and attaches auth to async local storage.
 */
export function mcpAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  if (!config.mcpAuthRequired) {
    return next();
  }

  const header = req.headers.authorization;
  if (!header?.startsWith("Bearer ")) {
    res.setHeader("WWW-Authenticate", wwwAuthenticateHeader());
    return res.status(401).json({
      error: "unauthorized",
      message: "Missing or invalid Authorization bearer token",
    });
  }

  const token = header.slice("Bearer ".length).trim();
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
    res.setHeader("WWW-Authenticate", wwwAuthenticateHeader());
    return res.status(401).json({
      error: "unauthorized",
      message: error instanceof Error ? error.message : "Invalid token",
    });
  }
}
