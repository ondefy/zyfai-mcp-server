/**
 * Historical Data Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

export function registerHistoricalTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService
) {
  server.tool(
    "get-history",
    "Get transaction history for a wallet",
    {
      walletAddress: z.string().describe("The smart wallet address"),
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .describe(
          "Chain ID (8453 for Base, 42161 for Arbitrum, 9745 for Sonic)"
        ),
      limit: z
        .number()
        .optional()
        .describe("Optional limit for number of results"),
      offset: z.number().optional().describe("Optional offset for pagination"),
      fromDate: z
        .string()
        .optional()
        .describe("Optional start date in YYYY-MM-DD format"),
      toDate: z
        .string()
        .optional()
        .describe("Optional end date in YYYY-MM-DD format"),
    },
    async ({ walletAddress, chainId, limit, offset, fromDate, toDate }) => {
      try {
        const response = await zyfiApi.getHistory(walletAddress, chainId, {
          limit,
          offset,
          fromDate,
          toDate,
        });
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching history: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get-daily-apy-history",
    "Get daily APY history with weighted average for a wallet",
    {
      walletAddress: z.string().describe("The smart wallet address"),
      days: z
        .enum(["7D", "14D", "30D"])
        .optional()
        .default("7D")
        .describe("Period: '7D', '14D', or '30D' (default: '7D')"),
    },
    async ({ walletAddress, days }) => {
      try {
        const response = await zyfiApi.getDailyApyHistory(
          walletAddress,
          days || "7D"
        );
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching daily APY history: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  server.tool(
    "get-first-topup",
    "Get the first topup (deposit) information for a wallet",
    {
      walletAddress: z.string().describe("The smart wallet address"),
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .describe(
          "Chain ID (8453 for Base, 42161 for Arbitrum, 9745 for Sonic)"
        ),
    },
    async ({ walletAddress, chainId }) => {
      try {
        const response = await zyfiApi.getFirstTopup(walletAddress, chainId);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(response, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching first topup: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
