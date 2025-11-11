/**
 * Portfolio & Position Management Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";
import { x402ToolWrapper } from "./x402-tools.wrapper.js";

export function registerPortfolioTools(
  server: McpServer,
  zyfiApi: ZyFAIApiService
) {
  server.tool(
    "get-portfolio",
    "Get complete portfolio information for a wallet address including all positions and total value",
    {
      walletAddress: z
        .string()
        .describe("The wallet address to fetch portfolio for (0x...)"),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.getPortfolio(walletAddress);
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
              text: `Error fetching portfolio: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );

  // Register multichain portfolio with x402 payment (1 USDC)
  const multichainHandler = x402ToolWrapper.wrapToolHandler(
    "get-multichain-portfolio",
    async ({ walletAddress }: { walletAddress: string }) => {
      try {
        const response = await zyfiApi.getMultiChainPortfolio(walletAddress);
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
              text: `Error fetching multi-chain portfolio: ${
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
    "get-multichain-portfolio",
    "Get multi-chain portfolio information for a wallet across all supported chains. [PAID: 1 USDC]",
    {
      walletAddress: z
        .string()
        .describe("The wallet address to fetch multi-chain portfolio for"),
    },
    multichainHandler as any
  );
}
