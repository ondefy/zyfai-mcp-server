/**
 * Analytics & Metrics Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";
import { x402ToolWrapper } from "./x402-tools.wrapper.js";

export function registerAnalyticsTools(
  server: McpServer,
  zyfiApi: ZyFAIApiService
) {
  // Register best positions with x402 payment (0.75 USDC)
  const bestPositionsHandler = x402ToolWrapper.wrapToolHandler(
    "get-best-positions",
    async ({ walletAddress }: { walletAddress: string }) => {
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
    "get-best-positions",
    "Get the best positions analysis for a wallet based on historical performance. [PAID: 0.75 USDC]",
    {
      walletAddress: z.string().describe("The wallet address to analyze"),
    },
    bestPositionsHandler as any
  );

  server.tool(
    "get-risk-metrics",
    "Get detailed risk metrics for a specific protocol, chain, and asset combination",
    {
      protocol: z.string().describe("Protocol name (e.g., 'Aave', 'Compound')"),
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

  // Register user earnings with x402 payment (0.5 USDC)
  const userEarningsHandler = x402ToolWrapper.wrapToolHandler(
    "get-user-earnings",
    async ({ walletAddress }: { walletAddress: string }) => {
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

  server.tool(
    "get-user-earnings",
    "Get earnings history and statistics for a user's wallet address. [PAID: 0.5 USDC]",
    {
      walletAddress: z
        .string()
        .describe("The wallet address to get earnings for"),
    },
    userEarningsHandler as any
  );
}
