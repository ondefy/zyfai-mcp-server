/**
 * Historical Data Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";

export function registerHistoricalTools(
  server: McpServer,
  zyfiApi: ZyFAIApiService
) {
  server.tool(
    "get-protocol-apy-history",
    "Get historical APY data for a specific protocol and chain",
    {
      protocol: z.string().describe("Protocol name"),
      chain: z.string().describe("Chain name"),
      days: z
        .number()
        .optional()
        .describe("Number of days of history (default: 30)"),
    },
    async ({ protocol, chain, days }) => {
      try {
        const response = await zyfiApi.getProtocolApyHistory({
          protocol,
          chain,
          days: days || 30,
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
              text: `Error fetching protocol APY history: ${
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
