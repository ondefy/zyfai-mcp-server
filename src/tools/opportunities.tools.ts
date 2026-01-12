/**
 * Opportunities Discovery Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

export function registerOpportunitiesTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService
) {
  server.tool(
    "get-safe-opportunities",
    "Get safe (low risk) DeFi opportunities suitable for conservative investors",
    {
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .optional()
        .describe(
          "Optional chain ID to filter opportunities (8453 for Base, 42161 for Arbitrum, 9745 for Sonic)"
        ),
    },
    async ({ chainId }) => {
      try {
        const response = await zyfiApi.getSafeOpportunities(chainId);
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
              text: `Error fetching safe opportunities: ${
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
    "get-degen-strategies",
    "Get degen (high-risk, high-reward) yield strategies for aggressive investors",
    {
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .optional()
        .describe(
          "Optional chain ID to filter strategies (8453 for Base, 42161 for Arbitrum, 9745 for Sonic)"
        ),
    },
    async ({ chainId }) => {
      try {
        const response = await zyfiApi.getDegenStrategies(chainId);
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
              text: `Error fetching degen strategies: ${
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
    "get-available-protocols",
    "Get available DeFi protocols and pools for a specific chain",
    {
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .describe(
          "Chain ID (8453 for Base, 42161 for Arbitrum, 9745 for Sonic)"
        ),
    },
    async ({ chainId }) => {
      try {
        const response = await zyfiApi.getAvailableProtocols(chainId);
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
              text: `Error fetching available protocols: ${
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
