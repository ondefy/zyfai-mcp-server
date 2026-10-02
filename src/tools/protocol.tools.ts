/**
 * Portfolio & Position Management Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { chainIdSchema, CHAIN_ID_DESCRIPTION } from "../config/chains.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

export function registerProtocolTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService
) {
  server.tool(
    "get-available-protocols",
    "Get available DeFi protocols and pools for a specific chain on Zyfai",
    {
      chainId: chainIdSchema.describe(CHAIN_ID_DESCRIPTION),
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
