/**
 * HTTP Routes - Using Streamable HTTP Transport
 */

import { Router, Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { randomUUID } from "crypto";

const router = Router();

// Store active transports by session ID for stateful mode
const transports = new Map<string, StreamableHTTPServerTransport>();

// Store API keys by session ID (for client-provided keys)
export const sessionApiKeys = new Map<string, string>();

/**
 * Setup HTTP routes with Streamable HTTP Transport
 */
export function setupRoutes(server: McpServer) {
  // Health check endpoint
  router.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      service: "zyfai-rebalancing-mcp",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      protocol: "Streamable HTTP",
      tools: {
        portfolio: 2,
        opportunities: 3,
        analytics: 8,
        historical: 3,
        helpers: 1,
        total: 17,
      },
    });
  });

  // Root endpoint - Server info
  router.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      message: "Zyfai DeFi MCP Server",
      version: "1.0.0",
      description:
        "MCP server providing access to Zyfai DeFi APIs for portfolio management, rebalancing, and opportunities discovery",
      transport: "Streamable HTTP",
      endpoints: {
        health: "/health",
        mcp: "/mcp",
      },
      tools: {
        categories: [
          "Portfolio & Position Management",
          "Opportunities Discovery",
          "Analytics & Metrics",
          "Historical Data",
          "User Flow Helpers",
        ],
        totalTools: 17,
      },
    });
  });

  // ============================================================================
  // Streamable HTTP MCP Endpoint
  // ============================================================================

  /**
   * Handle all MCP requests at /mcp endpoint
   * Supports both GET (for SSE streaming) and POST (for messages)
   */
  router.all("/mcp", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Extract client's API key from headers (if provided)
    const clientApiKey = req.headers["x-api-key"] as string | undefined;

    // Handle existing session
    if (sessionId && transports.has(sessionId)) {
      // Update API key for this session if provided
      if (clientApiKey && sessionId) {
        sessionApiKeys.set(sessionId, clientApiKey);
      }

      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // For new sessions or initialization requests
    if (req.method === "POST") {
      // Check if this is an initialization request
      const body = req.body;
      const isInitRequest =
        body?.method === "initialize" ||
        (Array.isArray(body) &&
          body.some((msg) => msg.method === "initialize"));

      if (isInitRequest || !sessionId) {
        // Create new transport for initialization
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });

        // Connect the MCP server to this transport
        await server.connect(transport);

        // Store the transport for future requests
        const newSessionId = transport.sessionId;
        if (newSessionId) {
          transports.set(newSessionId, transport);

          // Store client's API key for this session (if provided)
          if (clientApiKey) {
            sessionApiKeys.set(newSessionId, clientApiKey);
            console.log(
              `[MCP] Client API key registered for session: ${newSessionId}`
            );
          }

          // Clean up on close
          transport.onclose = () => {
            if (newSessionId) {
              transports.delete(newSessionId);
              sessionApiKeys.delete(newSessionId);
              console.log(`[MCP] Session closed: ${newSessionId}`);
            }
          };

          console.log(`[MCP] New session created: ${newSessionId}`);
        }

        // Handle the request
        await transport.handleRequest(req, res, req.body);
        return;
      }

      // Non-initialization request without valid session
      res.status(400).json({
        jsonrpc: "2.0",
        error: {
          code: -32600,
          message:
            "Bad Request: No valid session. Send an initialize request first.",
        },
        id: null,
      });
      return;
    }

    // GET requests for SSE streaming need a session
    if (req.method === "GET") {
      if (!sessionId) {
        res.status(400).json({
          jsonrpc: "2.0",
          error: {
            code: -32600,
            message: "Bad Request: Session ID required for GET requests.",
          },
          id: null,
        });
        return;
      }

      // Session not found
      res.status(404).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Session not found. Please initialize a new session.",
        },
        id: null,
      });
      return;
    }

    // Unsupported method
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32600,
        message: `Method ${req.method} not allowed. Use GET or POST.`,
      },
      id: null,
    });
  });

  // ============================================================================
  // SSE endpoint (for backward compatibility with existing clients)
  // ============================================================================

  /**
   * SSE endpoint handler - works alongside Streamable HTTP
   * Maintains compatibility with clients using the old SSE transport
   */
  router.all("/sse", async (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string | undefined;

    // Extract client's API key from headers (if provided)
    const clientApiKey = req.headers["x-api-key"] as string | undefined;

    // Handle existing session
    if (sessionId && transports.has(sessionId)) {
      // Update API key for this session if provided
      if (clientApiKey && sessionId) {
        sessionApiKeys.set(sessionId, clientApiKey);
      }

      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    // For new sessions or initialization requests
    if (req.method === "POST" || req.method === "GET") {
      // Check if this is an initialization request
      const body = req.body;
      const isInitRequest =
        body?.method === "initialize" ||
        (Array.isArray(body) &&
          body.some((msg) => msg.method === "initialize"));

      if (isInitRequest || !sessionId) {
        // Create new transport for initialization
        const transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
        });

        // Connect the MCP server to this transport
        await server.connect(transport);

        // Store the transport for future requests
        const newSessionId = transport.sessionId;
        if (newSessionId) {
          transports.set(newSessionId, transport);

          // Store client's API key for this session (if provided)
          if (clientApiKey) {
            sessionApiKeys.set(newSessionId, clientApiKey);
            console.log(
              `[MCP SSE] Client API key registered for session: ${newSessionId}`
            );
          }

          // Clean up on close
          transport.onclose = () => {
            if (newSessionId) {
              transports.delete(newSessionId);
              sessionApiKeys.delete(newSessionId);
              console.log(`[MCP SSE] Session closed: ${newSessionId}`);
            }
          };

          console.log(`[MCP SSE] New session created: ${newSessionId}`);
        }

        // Handle the request
        await transport.handleRequest(req, res, req.body);
        return;
      }
    }

    // No valid session
    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32600,
        message:
          "Bad Request: No valid session. Send an initialize request first.",
      },
      id: null,
    });
  });

  router.post("/messages", async (req: Request, res: Response) => {
    // Redirect to /sse endpoint for backward compatibility
    const sessionId = req.headers["mcp-session-id"] as string | undefined;
    const clientApiKey = req.headers["x-api-key"] as string | undefined;

    if (sessionId && transports.has(sessionId)) {
      if (clientApiKey && sessionId) {
        sessionApiKeys.set(sessionId, clientApiKey);
      }
      const transport = transports.get(sessionId)!;
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32600,
        message:
          "Bad Request: No valid session. Please initialize via /sse first.",
      },
      id: null,
    });
  });

  // ============================================================================
  // Session management endpoint
  // ============================================================================

  router.delete("/mcp", (req: Request, res: Response) => {
    const sessionId = req.headers["mcp-session-id"] as string;

    if (!sessionId) {
      res.status(400).json({
        error: "Missing Mcp-Session-Id header",
      });
      return;
    }

    const transport = transports.get(sessionId);
    if (transport) {
      transport.close();
      transports.delete(sessionId);
      sessionApiKeys.delete(sessionId); // Clean up API key
      console.log(`[MCP] Session deleted: ${sessionId}`);
      res.status(200).json({ status: "deleted" });
    } else {
      res.status(404).json({
        error: "Session not found",
      });
    }
  });

  // ============================================================================
  // CORS preflight
  // ============================================================================

  router.options("*", (req: Request, res: Response) => {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, DELETE, OPTIONS");
    res.setHeader(
      "Access-Control-Allow-Headers",
      "Content-Type, Authorization, Mcp-Session-Id, x-api-key, Accept"
    );
    res.status(200).end();
  });

  return router;
}
