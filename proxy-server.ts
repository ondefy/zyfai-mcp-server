#!/usr/bin/env node
/**
 * MCP Proxy Server
 * Bridges Claude Desktop (stdio) with Remote Streamable HTTP MCP Server
 *
 * Updated from deprecated SSE to Streamable HTTP transport (MCP 2024-11-05+)
 *
 * This proxy runs locally via stdio and forwards requests to the remote
 * Streamable HTTP MCP server at sdk.zyf.ai.
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { z } from "zod";

// Configuration
const REMOTE_SERVER_URL = process.env.REMOTE_MCP_URL || "https://sdk.zyf.ai";

// Color logging for debugging (stderr to avoid interfering with stdio)
const log = {
  info: (msg: string) => console.error(`[INFO] ${msg}`),
  error: (msg: string) => console.error(`[ERROR] ${msg}`),
  debug: (msg: string) => {
    if (process.env.DEBUG) {
      console.error(`[DEBUG] ${msg}`);
    }
  },
};

/**
 * MCP Proxy Server Class
 */
class MCPProxyServer {
  private client: Client;
  private server: Server;
  private isConnected = false;

  constructor() {
    // Create MCP client to connect to remote server
    this.client = new Client(
      {
        name: "mcp-proxy-client",
        version: "1.0.0",
      },
      {
        capabilities: {},
      }
    );

    // Create MCP server for Claude Desktop
    this.server = new Server(
      {
        name: "zyfai-rebalancing-proxy",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupServerHandlers();
  }

  /**
   * Setup server request handlers that forward to remote server
   */
  private setupServerHandlers(): void {
    // Forward tools/list requests
    this.server.setRequestHandler(
      z.object({ method: z.literal("tools/list") }),
      async () => {
        log.debug("Forwarding tools/list request to remote server");
        try {
          const response = await this.client.listTools();
          log.debug(
            `Received ${response.tools.length} tools from remote server`
          );
          return response;
        } catch (error) {
          log.error(`Failed to list tools: ${error}`);
          throw error;
        }
      }
    );

    // Forward tools/call requests
    this.server.setRequestHandler(
      z.object({ method: z.literal("tools/call") }),
      async (request: any) => {
        const toolName = request.params.name as string;
        const toolArgs = request.params.arguments || {};

        log.debug(`Forwarding tools/call request: ${toolName}`);

        try {
          const response = await this.client.callTool({
            name: toolName,
            arguments: toolArgs,
          });

          log.debug(`Tool ${toolName} executed successfully`);
          return response;
        } catch (error) {
          log.error(`Failed to call tool ${toolName}: ${error}`);
          throw error;
        }
      }
    );
  }

  /**
   * Connect to remote Streamable HTTP server
   * Updated from SSE to use the new unified /mcp endpoint
   */
  private async connectToRemoteServer(): Promise<void> {
    log.info(`Connecting to remote MCP server: ${REMOTE_SERVER_URL}`);

    try {
      // Use Streamable HTTP transport instead of deprecated SSE
      const transport = new StreamableHTTPClientTransport(
        new URL(`${REMOTE_SERVER_URL}/mcp`)
      );

      // Add timeout to connection attempt
      const connectPromise = this.client.connect(transport);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(
          () => reject(new Error("Connection timeout after 30 seconds")),
          30000
        );
      });

      await Promise.race([connectPromise, timeoutPromise]);
      this.isConnected = true;

      log.info(
        "✅ Successfully connected to remote MCP server (Streamable HTTP)"
      );

      // Log available tools
      try {
        const toolsPromise = this.client.listTools();
        const toolsTimeout = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error("List tools timeout")), 10000);
        });

        const tools = await Promise.race([toolsPromise, toolsTimeout]);
        log.info(`📦 Remote server provides ${tools.tools.length} tools`);
      } catch (error) {
        log.error(`Failed to list tools: ${error}`);
        // Don't fail startup if we can't list tools
      }
    } catch (error) {
      log.error(`Failed to connect to remote server: ${error}`);
      log.error(`Make sure ${REMOTE_SERVER_URL}/mcp is accessible`);
      throw error;
    }
  }

  /**
   * Start the proxy server
   */
  async start(): Promise<void> {
    try {
      // First connect to remote server
      await this.connectToRemoteServer();

      // Then setup stdio transport for Claude Desktop
      const transport = new StdioServerTransport();

      log.info("🚀 Starting proxy server with stdio transport...");

      await this.server.connect(transport);

      log.info("✅ Proxy server ready - Claude Desktop can now connect");
      log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
      log.info("🔄 Transport: Streamable HTTP (MCP 2024-11-05+)");
      log.info("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━");
    } catch (error) {
      log.error(`Failed to start proxy server: ${error}`);
      process.exit(1);
    }
  }

  /**
   * Cleanup on shutdown
   */
  async stop(): Promise<void> {
    log.info("Shutting down proxy server...");

    try {
      if (this.isConnected) {
        await this.client.close();
      }
      await this.server.close();
      log.info("✅ Proxy server shut down gracefully");
    } catch (error) {
      log.error(`Error during shutdown: ${error}`);
    }
  }
}

/**
 * Main execution
 */
async function main() {
  const proxy = new MCPProxyServer();

  // Handle graceful shutdown
  const shutdown = async (signal: string) => {
    log.info(`Received ${signal}, shutting down...`);
    await proxy.stop();
    process.exit(0);
  };

  process.on("SIGINT", () => shutdown("SIGINT"));
  process.on("SIGTERM", () => shutdown("SIGTERM"));

  // Handle errors
  process.on("uncaughtException", (error: Error) => {
    log.error(`Uncaught exception: ${error}`);
    process.exit(1);
  });

  process.on("unhandledRejection", (reason: unknown) => {
    log.error(`Unhandled rejection: ${reason}`);
    process.exit(1);
  });

  // Start the proxy
  await proxy.start();
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });
}
