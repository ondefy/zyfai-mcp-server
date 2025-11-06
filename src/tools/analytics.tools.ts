/**
 * Analytics & Metrics Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";

export function registerAnalyticsTools(
  server: McpServer,
  zyfiApi: ZyFAIApiService
) {
  server.tool(
    "get-best-positions",
    "Get the best positions analysis for a wallet based on historical performance",
    {
      walletAddress: z.string().describe("The wallet address to analyze"),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.getBestPositions(walletAddress);
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
              text: `Error fetching best positions: ${
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
    "get-risk-metrics",
    "Get detailed risk metrics for a specific protocol, chain, and asset combination",
    {
      protocol: z
        .string()
        .describe("Protocol name (e.g., 'Aave', 'Compound')"),
      chain: z.string().describe("Chain name (e.g., 'base', 'arbitrum')"),
      asset: z.string().describe("Asset symbol (e.g., 'USDC', 'ETH')"),
    },
    async ({ protocol, chain, asset }) => {
      try {
        const response = await zyfiApi.getRiskMetrics({
          protocol,
          chain,
          asset,
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
              text: `Error fetching risk metrics: ${
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
    "get-user-earnings",
    "Get earnings history and statistics for a user's wallet address",
    {
      walletAddress: z
        .string()
        .describe("The wallet address to get earnings for"),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.getUserEarnings(walletAddress);
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
              text: `Error fetching user earnings: ${
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

