/**
 * Rebalancing Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";

export function registerRebalancingTools(
  server: McpServer,
  zyfiApi: ZyFAIApiService
) {
  server.tool(
    "get-rebalance-recommendations",
    "Get rebalancing recommendations for a wallet including which positions should be rebalanced",
    {
      walletAddress: z
        .string()
        .describe("The wallet address to get rebalance recommendations for"),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.getRebalanceInfo(walletAddress);
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
              text: `Error fetching rebalance info: ${
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
    "get-same-chain-rebalance-recommendations",
    "Get same-chain rebalancing recommendations for a wallet (rebalance within the same blockchain)",
    {
      walletAddress: z
        .string()
        .describe(
          "The wallet address to get same-chain rebalance recommendations for"
        ),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.getSameChainRebalanceInfo(walletAddress);
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
              text: `Error fetching same-chain rebalance info: ${
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
    "get-cross-chain-rebalance-recommendations",
    "Get cross-chain rebalancing recommendations for a wallet (rebalance across different blockchains)",
    {
      walletAddress: z
        .string()
        .describe(
          "The wallet address to get cross-chain rebalance recommendations for"
        ),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.getCrossChainRebalanceInfo(
          walletAddress
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
              text: `Error fetching cross-chain rebalance info: ${
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
    "backtest-same-chain-rebalance",
    "Backtest a same-chain rebalancing strategy to see potential outcomes",
    {
      walletAddress: z.string().describe("The wallet address to backtest"),
      chainId: z
        .number()
        .describe("Chain ID (e.g., 8453 for Base, 42161 for Arbitrum)"),
    },
    async ({ walletAddress, chainId }) => {
      try {
        const response = await zyfiApi.backtestSameChainRebalance({
          walletAddress,
          chainId,
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
              text: `Error backtesting same-chain rebalance: ${
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
    "backtest-cross-chain-rebalance",
    "Backtest a cross-chain rebalancing strategy to see potential outcomes",
    {
      walletAddress: z.string().describe("The wallet address to backtest"),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.backtestCrossChainRebalance({
          walletAddress,
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
              text: `Error backtesting cross-chain rebalance: ${
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
