/**
 * Portfolio & Position Management Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";
import { sessionApiKeys } from "../routes/http.routes.js";

export function registerPortfolioTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService
) {
  server.tool(
    "get-debank-portfolio",
    "Get multi-chain portfolio information for a wallet across all supported chains using Debank",
    {
      walletAddress: z
        .string()
        .describe("The wallet address to fetch multi-chain portfolio for"),
    },
    async ({ walletAddress }, { sessionId }) => {
      try {
        // Get client's API key from session (if provided)
        const clientApiKey = sessionId ? sessionApiKeys.get(sessionId) : undefined;
        
        const response = await zyfiApi.getDebankPortfolio(walletAddress, clientApiKey);
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
              text: `Error fetching Debank portfolio: ${
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
    "get-positions",
    "Get all active DeFi positions for a user's wallet address",
    {
      userAddress: z
        .string()
        .describe("The user's EOA address to get positions for"),
      chainId: z
        .union([z.literal(8453), z.literal(42161), z.literal(9745)])
        .optional()
        .describe(
          "Optional chain ID to filter positions (8453 for Base, 42161 for Arbitrum, 9745 for Plasma)"
        ),
    },
    async ({ userAddress, chainId }, { sessionId }) => {
      try {
        // Get client's API key from session (if provided)
        const clientApiKey = sessionId ? sessionApiKeys.get(sessionId) : undefined;
        
        const response = await zyfiApi.getPositions(userAddress, chainId, clientApiKey);
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
              text: `Error fetching positions: ${
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
