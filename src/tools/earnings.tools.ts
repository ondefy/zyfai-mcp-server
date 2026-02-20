/**
 * Analytics & Metrics Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

export function registerEarningsTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService
) {
    server.tool(
        "get-daily-apy-history",
        "Get daily APY history for a wallet including total, current, and lifetime earnings",
        {
          walletAddress: z.string().describe("The smart wallet address"),
          days: z.enum(["7D", "14D", "30D"]).optional().default("7D").describe("Period: '7D', '14D', or '30D' (default: '7D')"),
        },
        async ({ walletAddress, days }) => {
          try {
            const response = await zyfiApi.getDailyApyHistory(walletAddress, days || "7D");
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
                  text: `Error fetching daily APY history: ${
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
    "get-onchain-earnings",
    "Get onchain earnings for a wallet including total, current, and lifetime earnings",
    {
      walletAddress: z
        .string()
        .describe("The smart wallet address to get earnings for"),
    },
    async ({ walletAddress }) => {
      try {
        const response = await zyfiApi.getOnchainEarnings(walletAddress);
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
              text: `Error fetching onchain earnings: ${
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
    "get-daily-earnings",
    "Get daily earnings for a wallet within a date range",
    {
      walletAddress: z
        .string()
        .describe("The smart wallet address to get daily earnings for"),
      startDate: z
        .string()
        .optional()
        .describe("Start date in YYYY-MM-DD format"),
      endDate: z.string().optional().describe("End date in YYYY-MM-DD format"),
    },
    async ({ walletAddress, startDate, endDate }) => {
      try {
        const response = await zyfiApi.getDailyEarnings(
          walletAddress,
          startDate,
          endDate
        );
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
              text: `Error fetching daily earnings: ${
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