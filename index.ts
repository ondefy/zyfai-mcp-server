/**
 * Zyfai DeFi MCP Server
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
import { createOAuthRoutes } from "./src/routes/oauth.routes.js";

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

// CORS configuration
app.use(
  cors({
    origin: config.allowedOrigins,
    credentials: true,
    exposedHeaders: ["Mcp-Session-Id"],
  })
);

app.use(requestLogger);
app.use(createOAuthRoutes());

// ============================================================================
// Create MCP Server & Register Tools
// ============================================================================

const server = new McpServer({
  name: "zyfai-defi-mcp",
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
      console.log(`  🚀 Zyfai DeFi MCP Server v1.0.0`);
      console.log(`${"=".repeat(60)}`);
      console.log(
        `\n📡 Server running on http://${config.host}:${config.port}`
      );
      console.log(`   MCP endpoint: http://${config.host}:${config.port}/mcp`);
      console.log(
        `   Health check: http://${config.host}:${config.port}/health`
      );
      console.log(`\n📦 Transport: Streamable HTTP (MCP 2024-11-05+)`);
      console.log(`   - Unified /mcp endpoint for all operations`);
      console.log(`   - Session-based with Mcp-Session-Id header`);
      console.log(`   - Supports streaming responses`);
      console.log(`\n🔧 MCP auth required: ${config.mcpAuthRequired}`);
      console.log(`   Agent tools: get_account, get_portfolio, find_opportunities,`);
      console.log(`   simulate_action, configure_position, prepare_deposit,`);
      console.log(`   submit_deposit, get_deposit_status (+ legacy read tools)`);
      console.log(`\n📚 Zyfai SDK: @zyfai/sdk`);
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
