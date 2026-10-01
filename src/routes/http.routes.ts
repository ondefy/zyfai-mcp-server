/**
 * HTTP Routes - stateless Streamable HTTP (one McpServer per request).
 */

import { Router, Request, Response } from "express";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import {
  authorizeMcpRequestBody,
  insufficientScopeWwwAuthenticate,
} from "../auth/tool-scope.js";
import { runWithMcpAuth } from "../auth/request-context.js";
import { config } from "../config/env.js";
import { createMcpServer } from "../create-mcp-server.js";
import {
  mcpAuthMiddleware,
  wwwAuthenticateHeader,
  type RequestWithMcpAuth,
} from "../middleware/mcp-auth.middleware.js";
import type { ZyfaiApiService } from "../services/zyfai-api.service.js";

async function handleMcpRequest(
  req: Request,
  res: Response,
  transport: StreamableHTTPServerTransport,
  body?: unknown,
) {
  const mcpAuth = (req as RequestWithMcpAuth).mcpAuth;
  if (body !== undefined) {
    const decision = authorizeMcpRequestBody(body, mcpAuth);
    if (!decision.ok) {
      res.setHeader(
        "WWW-Authenticate",
        decision.status === 401
          ? wwwAuthenticateHeader()
          : insufficientScopeWwwAuthenticate(),
      );
      res.status(decision.status).json({
        error: decision.error,
        message: decision.message,
      });
      return;
    }
  }
  if (mcpAuth) {
    await runWithMcpAuth(mcpAuth, async () => {
      await transport.handleRequest(req, res, body);
    });
    return;
  }
  await transport.handleRequest(req, res, body);
}

const router = Router();

export function setupRoutes(zyfaiApi: ZyfaiApiService) {
  router.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      service: "zyfai-rebalancing-mcp",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      protocol: "Streamable HTTP (stateless)",
    });
  });

  router.get("/", (_req: Request, res: Response) => {
    res.status(200).json({
      message: "Zyfai DeFi MCP Server",
      version: "1.0.0",
      transport: "Streamable HTTP (stateless)",
      endpoints: { health: "/health", mcp: "/mcp" },
    });
  });

  router.get("/.well-known/openai-apps-challenge", (_req: Request, res: Response) => {
    const token = config.openaiAppsChallengeToken;
    if (!token) {
      res.status(404).send("Not configured");
      return;
    }
    res.type("text/plain").send(token);
  });

  const handleStatelessMcp = async (req: Request, res: Response) => {
    const mcpServer = createMcpServer(zyfaiApi);
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: undefined,
    });

    try {
      await mcpServer.connect(transport);
      await handleMcpRequest(req, res, transport, req.body);
    } catch (error) {
      console.error("[MCP] Error handling request:", error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: "2.0",
          error: {
            code: -32603,
            message: "Internal server error",
            data: error instanceof Error ? error.message : "Unknown error",
          },
          id: null,
        });
      }
    } finally {
      await transport.close().catch(() => undefined);
      await mcpServer.close().catch(() => undefined);
    }
  };

  router.post("/mcp", mcpAuthMiddleware, handleStatelessMcp);
  router.get("/mcp", mcpAuthMiddleware, handleStatelessMcp);
  router.delete("/mcp", mcpAuthMiddleware, handleStatelessMcp);

  router.options("*", (_req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Mcp-Session-Id",
    );
    res.status(204).end();
  });

  return router;
}
