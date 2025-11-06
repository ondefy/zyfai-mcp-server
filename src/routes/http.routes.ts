/**
 * HTTP Routes
 * Express route handlers for REST endpoints
 */

import { Router, Request, Response } from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";

const router = Router();

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
        message: "/message",
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

  // SSE endpoint for MCP communication
  router.get("/sse", async (req: Request, res: Response) => {
    console.log("New SSE connection established");

    // Set SSE headers
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    try {
      const transport = new SSEServerTransport("/message", res);
      await server.connect(transport);

      // Handle client disconnect
      req.on("close", () => {
        console.log("SSE connection closed");
      });
    } catch (error) {
      console.error("Error in SSE connection:", error);
      res.status(500).end();
    }
  });

  // POST endpoint for MCP messages
  router.post("/message", async (req: Request, res: Response) => {
    try {
      // The SSE transport handles the message processing
      // This endpoint is used by the client to send messages
      res.status(200).json({ status: "received" });
    } catch (error) {
      console.error("Error processing message:", error);
      res.status(500).json({
        error: "Internal server error",
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  return router;
}

