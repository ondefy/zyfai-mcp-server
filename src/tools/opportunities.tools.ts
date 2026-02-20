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
    "get-conservative-opportunities",
    "Get safe (low risk) DeFi opportunities suitable for conservative investors",
    {
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .optional()
        .describe(
          "Optional chain ID to filter opportunities (8453 for Base, 42161 for Arbitrum, 9745 for Plasma)"
        ),
    },
    async ({ chainId }) => {
      try {
        const response = await zyfiApi.getConservativeOpportunities(chainId);
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
              text: `Error fetching conservative opportunities: ${
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
    "get-aggressive-opportunities",
    "Get degen (high-risk, high-reward) yield strategies for aggressive investors",
    {
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .optional()
        .describe(
          "Optional chain ID to filter strategies (8453 for Base, 42161 for Arbitrum, 9745 for Plasma)"
        ),
    },
    async ({ chainId }) => {
      try {
        const response = await zyfiApi.getAggressiveOpportunities(chainId);
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
              text: `Error fetching aggressive opportunities: ${
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
