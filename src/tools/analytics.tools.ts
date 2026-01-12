/**
 * Analytics & Metrics Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

export function registerAnalyticsTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService
) {
  server.tool(
    "get-onchain-earnings",
    "Get onchain earnings for a wallet including total, current, and lifetime earnings",
    {
      walletAddress: z
        .string()
        .describe("The smart wallet address to get earnings for"),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.getOnchainEarnings(walletAddress);
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
              text: `Error fetching onchain earnings: ${
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
    "calculate-onchain-earnings",
    "Calculate/refresh onchain earnings for a wallet (triggers recalculation on backend)",
    {
      walletAddress: z
        .string()
        .describe("The smart wallet address to calculate earnings for"),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.calculateOnchainEarnings(walletAddress);
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
              text: `Error calculating onchain earnings: ${
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
    "get-daily-earnings",
    "Get daily earnings for a wallet within a date range",
    {
      walletAddress: z
        .string()
        .describe("The smart wallet address to get daily earnings for"),
      startDate: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
    },
    async ({ walletAddress, startDate, endDate }) => {
      try {
        const response = await zyfiApi.getDailyEarnings(
          walletAddress,
          startDate,
          endDate
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
              text: `Error fetching daily earnings: ${
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
    "get-tvl",
    "Get total value locked (TVL) across all Zyfai accounts",
    {},
    async () => {
      try {
        const response = await zyfiApi.getTVL();
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
              text: `Error fetching TVL: ${
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
    "get-volume",
    "Get total volume across all Zyfai accounts",
    {},
    async () => {
      try {
        const response = await zyfiApi.getVolume();
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
              text: `Error fetching volume: ${
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
    "get-active-wallets",
    "Get active wallets for a specific chain",
    {
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .describe(
          "Chain ID to filter wallets (8453 for Base, 42161 for Arbitrum, 9745 for Sonic)"
        ),
    },
    async ({ chainId }) => {
      try {
        const response = await zyfiApi.getActiveWallets(chainId);
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
              text: `Error fetching active wallets: ${
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
    "get-smart-wallet-by-eoa",
    "Get smart wallets associated with an EOA address",
    {
      eoaAddress: z
        .string()
        .describe("The EOA (externally owned account) address"),
    },
    async ({ eoaAddress }) => {
      try {
        const response = await zyfiApi.getSmartWalletByEOA(eoaAddress);
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
              text: `Error fetching smart wallet by EOA: ${
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
    "get-rebalance-frequency",
    "Get rebalance frequency/tier for a wallet (determines how often wallet can be rebalanced)",
    {
      walletAddress: z.string().describe("The smart wallet address"),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.getRebalanceFrequency(walletAddress);
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
              text: `Error fetching rebalance frequency: ${
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
    "get-apy-per-strategy",
    "Get APY per strategy for a specific chain",
    {
      crossChain: z
        .boolean()
        .optional()
        .default(false)
        .describe(
          "Whether to get cross-chain APY (true = omni account, false = simple account)"
        ),
      days: z
        .number()
        .optional()
        .default(7)
        .describe("Time period in days: 7, 14, or 30"),
      strategy: z
        .string()
        .optional()
        .default("safe")
        .describe("Strategy type: 'safe' or 'degen'"),
    },
    async ({ crossChain, days, strategy }) => {
      try {
        const response = await zyfiApi.getAPYPerStrategy(
          crossChain || false,
          days || 7,
          strategy || "safe"
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
              text: `Error fetching APY per strategy: ${
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
