/**
 * Portfolio & Position Management Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

export function registerProtocolTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService
) {
  server.tool(
    "get-available-protocols",
    "Get available DeFi protocols and pools for a specific chain on Zyfai",
    {
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .describe(
          "Chain ID (8453 for Base, 42161 for Arbitrum, 9745 for Plasma)"
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
