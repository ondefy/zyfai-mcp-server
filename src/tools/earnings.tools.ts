/**
 * Session-scoped earnings and APY history.
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  requireAuthForTool,
  resolveSessionSmartWallet,
} from "../auth/user-scope.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";
import { toolError, toolJsonContent } from "./tool-response.js";

export function registerEarningsTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService,
) {
  server.tool(
    "get_earnings",
    "On-chain earnings totals for the authenticated user's smart wallet.",
    {},
    async () => {
      try {
        requireAuthForTool();
        const smartWallet = await resolveSessionSmartWallet(zyfiApi);
        const response = await zyfiApi.getOnchainEarnings(smartWallet);
        return toolJsonContent(response);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_daily_earnings",
    "Daily earnings breakdown for the authenticated user over a date range.",
    {
      startDate: z
        .string()
        .optional()
        .describe("Start date (YYYY-MM-DD)"),
      endDate: z.string().optional().describe("End date (YYYY-MM-DD)"),
    },
    async ({ startDate, endDate }) => {
      try {
        requireAuthForTool();
        const smartWallet = await resolveSessionSmartWallet(zyfiApi);
        const response = await zyfiApi.getDailyEarnings(
          smartWallet,
          startDate,
          endDate,
        );
        return toolJsonContent(response);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_apy_history",
    "Daily weighted APY history for the authenticated user's smart wallet.",
    {
      days: z
        .enum(["7D", "14D", "30D"])
        .optional()
        .default("7D")
        .describe("Lookback period"),
    },
    async ({ days }) => {
      try {
        requireAuthForTool();
        const smartWallet = await resolveSessionSmartWallet(zyfiApi);
        const response = await zyfiApi.getDailyApyHistory(smartWallet, days);
        return toolJsonContent(response);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );
}
