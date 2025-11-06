/**
 * MCP Tools Registration
 * Central export for all tool modules
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";
import { registerPortfolioTools } from "./portfolio.tools.js";
import { registerOpportunitiesTools } from "./opportunities.tools.js";
import { registerRebalancingTools } from "./rebalancing.tools.js";
import { registerAnalyticsTools } from "./analytics.tools.js";
import { registerHistoricalTools } from "./historical.tools.js";
import { registerHelperTools } from "./helpers.tools.js";

/**
 * Register all MCP tools with the server
 */
export function registerAllTools(server: McpServer, zyfiApi: ZyFAIApiService) {
  registerPortfolioTools(server, zyfiApi);
  registerOpportunitiesTools(server, zyfiApi);
  registerRebalancingTools(server, zyfiApi);
  registerAnalyticsTools(server, zyfiApi);
  registerHistoricalTools(server, zyfiApi);
  registerHelperTools(server, zyfiApi);
}
