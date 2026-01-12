/**
 * Zyfai Rebalancing MCP Server
 * Main entry point - Modular architecture
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import express from "express";
import cors from "cors";

// Configuration
import { config } from "./src/config/env.js";

// Services
import { ZyfaiApiService } from "./src/services/zyfai-api.service.js";

// Tools
import { registerAllTools } from "./src/tools/index.js";

// Routes
import { setupRoutes } from "./src/routes/http.routes.js";

// Middleware
import {
  requestLogger,
  errorHandler,
  notFoundHandler,
} from "./src/middleware/index.js";

// ============================================================================
// Initialize Services
// ============================================================================

const zyfiApi = new ZyfaiApiService();

// ============================================================================
// Create Express App
// ============================================================================

const app = express();

// Middleware
app.use(express.json());
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
  })
);
app.use(requestLogger);

// ============================================================================
// Create MCP Server & Register Tools
// ============================================================================

const server = new McpServer({
  name: "zyfai-rebalancing-mcp",
  version: "1.0.0",
});

// Register all MCP tools
registerAllTools(server, zyfiApi);

// ============================================================================
// Setup Routes
// ============================================================================

app.use(setupRoutes(server));

// ============================================================================
// Error Handlers
// ============================================================================

app.use(errorHandler);
app.use(notFoundHandler);

// ============================================================================
// Server Initialization
// ============================================================================

async function main() {
  try {
    // Start Express server
    app.listen(config.port, config.host, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`🚀 Zyfai Rebalancing MCP Server v1.0.0`);
      console.log(`${"=".repeat(60)}`);
      console.log(
        `\n📡 Server running on http://${config.host}:${config.port}`
      );
      console.log(`🔌 SSE endpoint: http://${config.host}:${config.port}/sse`);
      console.log(
        `💓 Health check: http://${config.host}:${config.port}/health`
      );
      console.log(`\n🛠️  Available MCP Tools: 17`);
      console.log(`   - Portfolio Management: 2 tools`);
      console.log(`   - Opportunities: 3 tools`);
      console.log(`   - Analytics & Metrics: 8 tools`);
      console.log(`   - Historical Data: 3 tools`);
      console.log(`   - User Flow Helpers: 1 tool`);
      console.log(`\n🔗 Zyfai SDK: Using @zyfai/sdk`);
      console.log(`${"=".repeat(60)}\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on("SIGTERM", () => {
  console.log("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.log("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// ============================================================================
// Start Server
// ============================================================================

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
