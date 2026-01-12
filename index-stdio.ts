#!/usr/bin/env node
/**
 * Zyfai Rebalancing MCP Server - STDIO Mode
 * For direct use with Claude Desktop (no HTTP/SSE)
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";

// Services
import { ZyFAIApiService } from "./src/services/zyfai-api.service.js";

// Tools
import { registerAllTools } from "./src/tools/index.js";

// ============================================================================
// Initialize Services
// ============================================================================

const zyfiApi = new ZyFAIApiService();

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
// Server Initialization
// ============================================================================

async function main() {
  try {
    const transport = new StdioServerTransport();

    // Log to stderr to avoid interfering with stdio protocol
    console.error("🚀 Zyfai Rebalancing MCP Server (stdio mode)");
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    console.error(`📦 Available Tools: 18`);
    console.error("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n");

    await server.connect(transport);

    console.error("✅ Server ready - Connected via stdio");
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

// ============================================================================
// Graceful Shutdown
// ============================================================================

process.on("SIGTERM", () => {
  console.error("SIGTERM received, shutting down gracefully...");
  process.exit(0);
});

process.on("SIGINT", () => {
  console.error("SIGINT received, shutting down gracefully...");
  process.exit(0);
});

// ============================================================================
// Start Server
// ============================================================================

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
