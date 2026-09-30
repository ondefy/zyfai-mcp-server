/**
 * Zyfai DeFi MCP Server
 * Main entry point - Modular architecture
 */

import { config } from "./src/config/env.js";
import { createApp } from "./src/create-app.js";

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
      console.log(`\n🔧 MCP auth required: ${config.mcpAuthRequired}`);
      console.log(
        `   Agent tools: get_account, get_portfolio, find_opportunities,`,
      );
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
