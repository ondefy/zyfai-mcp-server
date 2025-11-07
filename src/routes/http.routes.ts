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
    console.log(`[SSE] New connection request`);

    const transport = new SSEServerTransport("/messages", res);
    const sessionId = transport.sessionId;

    console.log(`[SSE] Session created: ${sessionId}`);

    transports.set(sessionId, transport);

    res.on("close", () => {
      console.log(`[SSE] Connection closed: ${sessionId}`);
      transports.delete(sessionId);
    });

    await server.connect(transport);

    console.log(`[SSE] Transport connected: ${sessionId}`);
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

    // Get transport
    const transport = transports.get(sessionId);

    if (!transport) {
      console.error(`[Messages] Session not found: ${sessionId}`);
      return res.status(404).json({
        error: "Session not found",
        message: `No active session found for ID: ${sessionId}`,
      });
    }

    // Forward the message to the transport for processing
    try {
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
