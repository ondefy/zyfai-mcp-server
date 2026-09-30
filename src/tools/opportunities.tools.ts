/**
 * Opportunities Discovery Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { optionalChainIdSchema, CHAIN_ID_DESCRIPTION } from "../config/chains.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

export function registerOpportunitiesTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService
) {
  server.tool(
    "get-conservative-opportunities",
    "Get safe (low risk) DeFi opportunities suitable for conservative investors",
    {
      chainId: optionalChainIdSchema.describe(
        `Optional chain ID to filter opportunities. ${CHAIN_ID_DESCRIPTION}`
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
      chainId: optionalChainIdSchema.describe(
        `Optional chain ID to filter strategies. ${CHAIN_ID_DESCRIPTION}`
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
