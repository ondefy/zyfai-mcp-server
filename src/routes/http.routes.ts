/**
 * HTTP Routes - Streamable HTTP Transport
 * Updated from deprecated SSE to modern Streamable HTTP standard
 */

import { Router, Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { randomUUID } from "crypto";
import { runWithMcpAuth } from "../auth/request-context.js";
import { createMcpServer } from "../create-mcp-server.js";
import {
  mcpAuthMiddleware,
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
  if (mcpAuth) {
    await runWithMcpAuth(mcpAuth, async () => {
      await transport.handleRequest(req, res, body);
    });
    return;
  }
  await transport.handleRequest(req, res, body);
}

const router = Router();

type McpSession = {
  transport: StreamableHTTPServerTransport;
  server: McpServer;
};

// Store active MCP sessions (one server + transport pair per client session)
const sessions = new Map<string, McpSession>();

/**
 * Setup HTTP routes with Streamable HTTP transport
 */
export function setupRoutes(zyfaiApi: ZyfaiApiService) {
  // Health check endpoint
  router.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      service: "zyfai-rebalancing-mcp",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      protocol: "Streamable HTTP",
      tools: {
        agent: 11,
        protocol: 1,
        userSession: 3,
        earnings: 3,
        total: 18,
      },
    });
  });

  // Root endpoint - Server info
  router.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      message: "Zyfai DeFi MCP Server",
      version: "1.0.0",
      description:
        "MCP server for authenticated Zyfai users: portfolio, earnings, opportunities, and agent actions",
      transport: "Streamable HTTP",
      endpoints: {
        health: "/health",
        mcp: "/mcp",
      },
      protocol: "Streamable HTTP (MCP 2024-11-05+)",
      tools: {
        categories: ["Agent", "Protocol", "User session", "Earnings"],
        totalTools: 18,
      },
    });
  });

  // ============================================================================
  // Unified MCP Endpoint - Streamable HTTP Transport
  // ============================================================================

  /**
   * POST /mcp - Main MCP endpoint for all client requests
   * Handles both initialization and regular tool calls
   * Supports streaming responses for long-running operations
   */
  router.post("/mcp", mcpAuthMiddleware, async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    let transport: StreamableHTTPServerTransport;

    try {
      // Check if this is an initialization request
      const isInitRequest = isInitializeRequest(req.body);

      if (isInitRequest) {
        // Create new session for initialization requests
        const newSessionId = randomUUID();

        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => newSessionId,
          onsessioninitialized: (id) => {
            console.log(`[MCP] Session initialized: ${id}`);
          },
        });

        const mcpServer = createMcpServer(zyfaiApi);
        sessions.set(newSessionId, { transport, server: mcpServer });

        await mcpServer.connect(transport);

        console.log(`[MCP] New session created: ${newSessionId}`);
      } else {
        // For non-init requests, get existing transport
        if (!sessionId) {
          res.status(400).json({
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message:
                "Missing Mcp-Session-Id header for non-initialization request",
            },
            id: null,
          });
          return;
        }

        const existingSession = sessions.get(sessionId);
        if (!existingSession) {
          res.status(404).json({
            jsonrpc: "2.0",
            error: {
              code: -32600,
              message: `Session not found: ${sessionId}`,
            },
            id: null,
          });
          return;
        }

        transport = existingSession.transport;
        console.log(`[MCP] Using existing session: ${sessionId}`);
      }

      // Handle the request through the transport
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
    }
  });

  /**
   * GET /mcp - Server-to-client streaming endpoint
   * Used for server-initiated notifications and streaming responses
   */
  router.get("/mcp", mcpAuthMiddleware, async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Missing Mcp-Session-Id header",
        },
        id: null,
      });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: `Session not found: ${sessionId}`,
        },
        id: null,
      });
      return;
    }

    console.log(`[MCP] GET stream opened for session: ${sessionId}`);

    // Handle SSE streaming for server notifications
    await handleMcpRequest(req, res, session.transport);
  });

  /**
   * DELETE /mcp - Cleanup session
   * Allows clients to explicitly terminate their session
   */
  router.delete("/mcp", mcpAuthMiddleware, async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    if (!sessionId) {
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: "Missing Mcp-Session-Id header",
        },
        id: null,
      });
      return;
    }

    const session = sessions.get(sessionId);
    if (!session) {
      res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message: `Session not found: ${sessionId}`,
        },
        id: null,
      });
      return;
    }

    try {
      await session.transport.close();
      await session.server.close();
      sessions.delete(sessionId);
      console.log(`[MCP] Session terminated: ${sessionId}`);
      res.status(200).json({ status: "session_terminated", sessionId });
    } catch (error) {
      console.error(`[MCP] Error closing session ${sessionId}:`, error);
      res.status(500).json({
        jsonrpc: "2.0",
        error: {
          code: -32603,
          message: "Error terminating session",
        },
        id: null,
      });
    }
  });

  // ============================================================================
  // Legacy SSE endpoints (deprecated - redirect to new endpoint)
  // ============================================================================

  /**
   * GET /sse - Deprecated SSE endpoint
   * Returns 410 Gone with migration instructions
   */
  router.get("/sse", (req: Request, res: Response) => {
    res.status(410).json({
      error: "Deprecated",
      message:
        "The /sse endpoint has been deprecated. Please use the /mcp endpoint with Streamable HTTP transport.",
      migration: {
        newEndpoint: "/mcp",
        documentation:
          "https://modelcontextprotocol.io/specification/2024-11-05/basic/transports",
      },
    });
  });

  /**
   * POST /messages - Deprecated messages endpoint
   * Returns 410 Gone with migration instructions
   */
  router.post("/messages", (req: Request, res: Response) => {
    res.status(410).json({
      error: "Deprecated",
      message:
        "The /messages endpoint has been deprecated. Please use the /mcp endpoint with Streamable HTTP transport.",
      migration: {
        newEndpoint: "/mcp",
        documentation:
          "https://modelcontextprotocol.io/specification/2024-11-05/basic/transports",
      },
    });
  });

  // ============================================================================
  // CORS preflight
  // ============================================================================

  router.options("*", (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Mcp-Session-Id"
    );
    res.status(200).end();
  });

  return router;
}
