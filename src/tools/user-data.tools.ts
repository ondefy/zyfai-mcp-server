/**
 * Historical Data Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

export function registerUserDataTools(
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
          "Chain ID (8453 for Base, 42161 for Arbitrum, 9745 for Plasma)"
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
    "get-first-topup",
    "Get the first topup (deposit) information for a wallet",
    {
      walletAddress: z.string().describe("The smart wallet address"),
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .describe(
          "Chain ID (8453 for Base, 42161 for Arbitrum, 9745 for Plasma)"
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

  server.tool(
    "get-positions",
    "Get all active DeFi positions and portfolio for a user's wallet address",
    {
      userAddress: z
        .string()
        .describe("The user's EOA address to get positions and portfolio for"),
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .optional()
        .describe(
          "Optional chain ID to filter positions and portfolio (8453 for Base, 42161 for Arbitrum, 9745 for Plasma)"
        ),
    },
    async ({ userAddress, chainId }) => {
      try {
        const response = await zyfiApi.getPositions(userAddress, chainId);
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
              text: `Error fetching positions and portfolio: ${
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
