import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { ZyfaiApiService } from "./services/zyfai-api.service.js";
import { registerAllTools } from "./tools/index.js";

/** One McpServer per Streamable HTTP session (SDK allows a single transport per server). */
export function createMcpServer(zyfaiApi: ZyfaiApiService): McpServer {
  const mcpServer = new McpServer({
    name: "zyfai-defi-mcp",
    version: "1.0.0",
  });
  registerAllTools(mcpServer, zyfaiApi);
  return mcpServer;
}
