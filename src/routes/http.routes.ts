/**
 * HTTP Routes - Optimized for Fast SSE Response
 * Fixes timeout issues by immediately sending endpoint event
 */

import { Router, Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const router = Router();

// Store active transports by session ID
const transports = new Map<string, SSEServerTransport>();
const pendingTransports = new Map<string, Promise<SSEServerTransport>>();

// Generate session IDs
function generateSessionId(): string {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Setup HTTP routes
 */
export function setupRoutes(server: McpServer) {
  // Health check endpoint
  router.get("/health", (req: Request, res: Response) => {
    res.status(200).json({
      status: "healthy",
      service: "zyfai-rebalancing-mcp",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      protocol: "HTTP+SSE (optimized)",
      tools: {
        portfolio: 2,
        opportunities: 4,
        rebalancing: 5,
        analytics: 3,
        historical: 2,
        helpers: 2,
        total: 18,
      },
    });
  });

  // Root endpoint
  router.get("/", (req: Request, res: Response) => {
    res.status(200).json({
      message: "ZyFAI Rebalancing MCP Server",
      version: "1.0.0",
      description:
        "MCP server providing access to ZyFAI DeFi APIs for portfolio management, rebalancing, and opportunities discovery",
      endpoints: {
        health: "/health",
        sse: "/sse",
        messages: "/messages",
      },
      tools: {
        categories: [
          "Portfolio & Position Management",
          "Opportunities Discovery",
          "Rebalancing",
          "Analytics & Metrics",
          "Historical Data",
          "User Flow Helpers",
        ],
        totalTools: 18,
      },
      documentation: "https://github.com/your-repo/mcp-server-template",
    });
  });

  // ============================================================================
  // Optimized SSE endpoint - Sends endpoint event IMMEDIATELY
  // ============================================================================

  /**
   * GET /sse - SSE endpoint with immediate response
   * Key fix: Send endpoint event before awaiting server.connect()
   */
  router.get("/sse", async (req: Request, res: Response) => {
    const sessionId = generateSessionId();
    const messageEndpoint = `/messages?sessionId=${sessionId}`;

    console.log(`[SSE] New connection: ${sessionId}`);

    // Set SSE headers IMMEDIATELY
    res.writeHead(200, {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
      "Access-Control-Allow-Origin": "*",
      "X-Accel-Buffering": "no",
    });

    // CRITICAL FIX: Send endpoint event IMMEDIATELY (before any async operations)
    // This prevents timeout issues by responding within <1 second
    res.write(`event: endpoint\n`);
    res.write(`data: ${messageEndpoint}\n\n`);
    res.flushHeaders();

    console.log(`[SSE] Sent endpoint event immediately: ${sessionId}`);

    // Prevent request timeout
    req.setTimeout(0);
    res.setTimeout(0);

    try {
      // Now create and connect transport (client already has endpoint)
      const transportPromise = (async () => {
        const transport = new SSEServerTransport(messageEndpoint, res);

        // Manually set session ID
        (transport as any).sessionId = sessionId;

        // Store before connecting
        transports.set(sessionId, transport);

        // Connect to server
        await server.connect(transport);

        console.log(`[SSE] Transport connected: ${sessionId}`);

        return transport;
      })();

      // Store pending promise
      pendingTransports.set(sessionId, transportPromise);

      // Wait for connection
      await transportPromise;

      // Remove from pending
      pendingTransports.delete(sessionId);

      // Handle client disconnect
      req.on("close", () => {
        console.log(`[SSE] Connection closed: ${sessionId}`);
        transports.delete(sessionId);
        pendingTransports.delete(sessionId);
      });

      // Keep connection alive with periodic heartbeat
      const heartbeat = setInterval(() => {
        if (res.writable) {
          res.write(": heartbeat\n\n");
        } else {
          clearInterval(heartbeat);
        }
      }, 30000); // 30 second heartbeat

      req.on("close", () => {
        clearInterval(heartbeat);
      });
    } catch (error) {
      console.error(`[SSE] Error for session ${sessionId}:`, error);
      pendingTransports.delete(sessionId);
      transports.delete(sessionId);

      if (res.writable) {
        res.write(`event: error\n`);
        res.write(
          `data: ${JSON.stringify({ error: "Connection failed" })}\n\n`
        );
        res.end();
      }
    }
  });

  // ============================================================================
  // Message endpoint - Handles client messages
  // ============================================================================

  /**
   * POST /messages - Receives messages for a session
   */
  router.post("/messages", async (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({
        error: "Missing sessionId",
        message: "sessionId query parameter is required",
      });
    }

    console.log(`[Messages] Received for session: ${sessionId}`);

    try {
      // Wait for pending transport if still being created
      const pendingPromise = pendingTransports.get(sessionId);
      if (pendingPromise) {
        console.log(`[Messages] Waiting for pending transport: ${sessionId}`);
        await pendingPromise;
      }

      // Get transport
      const transport = transports.get(sessionId);

      if (!transport) {
        console.error(`[Messages] Session not found: ${sessionId}`);
        return res.status(404).json({
          error: "Session not found",
          message: `No active session found for ID: ${sessionId}. Sessions: ${Array.from(
            transports.keys()
          ).join(", ")}`,
        });
      }

      // CRITICAL FIX: Forward the message to the transport
      // This is what actually processes the JSON-RPC message
      await transport.handlePostMessage(req, res, req.body);
    } catch (error) {
      console.error(`[Messages] Error for session ${sessionId}:`, error);

      if (!res.headersSent) {
        res.status(500).json({
          error: "Internal server error",
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  });

  /**
   * DELETE /messages - Cleanup session
   */
  router.delete("/messages", (req: Request, res: Response) => {
    const sessionId = req.query.sessionId as string;

    if (!sessionId) {
      return res.status(400).json({
        error: "Missing sessionId",
        message: "sessionId query parameter is required",
      });
    }

    console.log(`[Delete] Cleaning up session: ${sessionId}`);

    const deleted = transports.delete(sessionId);
    pendingTransports.delete(sessionId);

    if (deleted) {
      res.status(200).json({ status: "deleted" });
    } else {
      res.status(404).json({
        error: "Session not found",
        message: `No active session found for ID: ${sessionId}`,
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
      "Content-Type, Authorization"
    );
    res.status(200).end();
  });

  return router;
}
