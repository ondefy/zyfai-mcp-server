/**
 * Zyfai DeFi MCP Server
 * Main entry point - Modular architecture
 */

import { assertProductionMcpConfig, config } from "./src/config/env.js";
import { createApp } from "./src/create-app.js";

assertProductionMcpConfig();

const { app } = createApp();

async function main() {
  try {
    app.listen(config.port, config.host, () => {
      console.log(`\n${"=".repeat(60)}`);
      console.log(`  🚀 Zyfai DeFi MCP Server v1.0.0`);
      console.log(`${"=".repeat(60)}`);
      console.log(
        `\n📡 Server running on http://${config.host}:${config.port}`,
      );
      console.log(`   MCP endpoint: http://${config.host}:${config.port}/mcp`);
      console.log(
        `   Health check: http://${config.host}:${config.port}/health`,
      );
      console.log(`\n📦 Transport: Streamable HTTP (MCP 2024-11-05+)`);
      console.log(`   - Unified /mcp endpoint for all operations`);
      console.log(`   - Session-based with Mcp-Session-Id header`);
      console.log(`   - Supports streaming responses`);
      console.log(
        `\n🔧 MCP auth required: ${config.mcpAuthRequired} (bearer validated when present)`,
      );
      console.log(
        `   Tools: agent (account, portfolio, deposits, mandate),`,
      );
      console.log(
        `   session reads (history, earnings, rebalance tier),`,
      );
      console.log(`   discovery (find_opportunities, get-available-protocols)`);
      console.log(`\n📚 Zyfai SDK: @zyfai/sdk`);
      console.log(`${"=".repeat(60)}\n`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

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
