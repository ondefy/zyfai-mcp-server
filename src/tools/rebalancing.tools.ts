/**
 * Rebalancing Tools
 * Note: Only rebalance frequency is available in SDK
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";

export function registerRebalancingTools(
  server: McpServer,
  zyfiApi: ZyFAIApiService
) {
  // Rebalance frequency is registered in analytics.tools.ts
  // This file is kept for consistency but is empty
  // All rebalancing-related tools are in analytics.tools.ts
}
