/**
 * Opportunities Discovery Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";

export function registerOpportunitiesTools(
  server: McpServer,
  zyfiApi: ZyFAIApiService
) {
  server.tool(
    "get-top-opportunities",
    "Get the top DeFi opportunities across all chains and protocols",
    {},
    async () => {
      try {
        const response = await zyfiApi.getTopOpportunities();
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
              text: `Error fetching top opportunities: ${
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
    "get-safe-opportunities",
    "Get safe (low risk) DeFi opportunities suitable for conservative investors",
    {},
    async () => {
      try {
        const response = await zyfiApi.getSafeOpportunities();
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
    "get-degen-opportunities",
    "Get high-risk high-reward DeFi opportunities for aggressive investors",
    {},
    async () => {
      try {
        const response = await zyfiApi.getDegenOpportunities();
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
              text: `Error fetching degen opportunities: ${
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
    "get-degen-acp-opportunities",
    "Get degen ACP opportunities for a specific chain (high-risk, high-reward with ACP protocol)",
    {
      chainId: z
        .number()
        .describe("Chain ID (e.g., 8453 for Base, 42161 for Arbitrum)"),
    },
    async ({ chainId }) => {
      try {
        const response = await zyfiApi.getDegenAcpOpportunities(chainId);
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
              text: `Error fetching degen ACP opportunities: ${
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

