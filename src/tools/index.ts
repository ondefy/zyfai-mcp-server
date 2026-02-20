/**
 * MCP Tools Registration
 * Central export for all tool modules
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";
import { registerProtocolTools } from "./protocol.tools.js";
import { registerOpportunitiesTools } from "./opportunities.tools.js";
import { registerAnalyticsTools } from "./analytics.tools.js";
import { registerUserDataTools } from "./user-data.tools.js";
import { registerEarningsTools } from "./earnings.tools.js";

/**
 * Register all MCP tools with the server
 */
export function registerAllTools(server: McpServer, zyfiApi: ZyfaiApiService) {
  registerProtocolTools(server, zyfiApi);
  registerOpportunitiesTools(server, zyfiApi);
  registerAnalyticsTools(server, zyfiApi);
  registerUserDataTools(server, zyfiApi);
  registerEarningsTools(server, zyfiApi);
}
