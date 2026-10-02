/**
 * Session-scoped historical and position-adjacent reads.
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  requireAuthForTool,
  resolveSessionSmartWallet,
} from "../auth/user-scope.js";
import { chainIdSchema, CHAIN_ID_DESCRIPTION } from "../config/chains.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";
import { toolError, toolJsonContent } from "./tool-response.js";

export function registerUserDataTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService,
) {
  server.tool(
    "get_history",
    "Transaction history for the authenticated user's smart wallet.",
    {
      chainId: chainIdSchema.describe(CHAIN_ID_DESCRIPTION),
      limit: z.number().optional().describe("Optional limit for results"),
      offset: z.number().optional().describe("Optional pagination offset"),
      fromDate: z
        .string()
        .optional()
        .describe("Optional start date (YYYY-MM-DD)"),
      toDate: z
        .string()
        .optional()
        .describe("Optional end date (YYYY-MM-DD)"),
    },
    async ({ chainId, limit, offset, fromDate, toDate }) => {
      try {
        requireAuthForTool();
        const smartWallet = await resolveSessionSmartWallet(zyfiApi);
        const response = await zyfiApi.getHistory(smartWallet, chainId, {
          limit,
          offset,
          fromDate,
          toDate,
        });
        return toolJsonContent(response);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_first_deposit",
    "First deposit (top-up) for the authenticated user on a chain.",
    {
      chainId: chainIdSchema.describe(CHAIN_ID_DESCRIPTION),
    },
    async ({ chainId }) => {
      try {
        requireAuthForTool();
        const smartWallet = await resolveSessionSmartWallet(zyfiApi);
        const response = await zyfiApi.getFirstTopup(smartWallet, chainId);
        return toolJsonContent(response);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_rebalance_frequency",
    "Rebalance tier and frequency for the authenticated user's smart wallet.",
    {},
    async () => {
      try {
        requireAuthForTool();
        const smartWallet = await resolveSessionSmartWallet(zyfiApi);
        const response = await zyfiApi.getRebalanceFrequency(smartWallet);
        return toolJsonContent(response);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );
}