import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from "zod";
import express, { Request, Response, NextFunction } from "express";
import cors from "cors";

// Environment variables with defaults
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;
const HOST = process.env.HOST || "0.0.0.0";
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS?.split(",") || ["*"];

// Create Express app
const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: ALLOWED_ORIGINS,
    credentials: true,
  })
);

// Request logging middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

// Create server instance
const server = new McpServer({
  name: "zyfai-rebalancing-mcp",
  version: "0.0.1",
});

// Define a sample tool
server.tool(
  "rebalancing-tool",
  "Rebalancing tool for ZYFAI",
  {
    input: z.string().describe("Input parameter for the rebalancing tool"),
  },
  async ({ input }) => {
    // Process the input
    const output = `Processed: ${input}`;
    // Return the result
    return {
      content: [
        {
          type: "text",
          text: output,
        },
      ],
    };
  }
);

// Health check endpoint
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({
    status: "healthy",
    service: "zyfai-rebalancing-mcp",
    version: "0.0.1",
    timestamp: new Date().toISOString(),
  });
});

// Root endpoint
app.get("/", (req: Request, res: Response) => {
  res.status(200).json({
    message: "ZYFAI Rebalancing MCP Server",
    version: "0.0.1",
    endpoints: {
      health: "/health",
      sse: "/sse",
    },
  });
});

// SSE endpoint for MCP communication
app.get("/sse", async (req: Request, res: Response) => {
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
app.post("/message", async (req: Request, res: Response) => {
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

// Global error handler
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Unhandled error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: err.message,
  });
});

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: "Not found",
    path: req.path,
  });
});

async function main() {
  try {
    // Start Express server
    app.listen(PORT, HOST, () => {
      console.log(`MCP Server running on http://${HOST}:${PORT}`);
      console.log(`SSE endpoint: http://${HOST}:${PORT}/sse`);
      console.log(`Health check: http://${HOST}:${PORT}/health`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
