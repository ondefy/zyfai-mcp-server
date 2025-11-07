/**
 * User Flow Helper Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";

export function registerHelperTools(
  server: McpServer,
  zyfiApi: ZyFAIApiService
) {
  server.tool(
    "complete-user-onboarding-flow",
    "Complete onboarding flow information: Creates Safe7579 wallet, adds session key, and provides deposit opportunities",
    {
      userAddress: z
        .string()
        .optional()
        .describe("Optional existing wallet address"),
    },
    async ({ userAddress }) => {
      try {
        // Step 1: Get safe opportunities for initial deposit
        const opportunities = await zyfiApi.getSafeOpportunities();

        // Step 2: If user has address, get their current portfolio
        let portfolio = null;
        if (userAddress) {
          try {
            portfolio = await zyfiApi.getPortfolio(userAddress);
          } catch (err) {
            console.error("No existing portfolio found, user is new");
          }
        }

        const onboardingInfo = {
          step: "onboarding-complete",
          message: "User onboarding information retrieved successfully",
          nextSteps: {
            "1": "Create Safe7579 account (handled by frontend/smart contract)",
            "2": "Add session key for automated operations",
            "3": "Review safe opportunities below",
            "4": "Make initial deposit to chosen protocol",
          },
          safeOpportunities: opportunities.data,
          existingPortfolio: portfolio?.data || null,
          instructions: {
            safe7579:
              "Safe7579 is an ERC-4337 compatible smart contract wallet. Deploy via the ZyFAI frontend or smart contract integration.",
            sessionKey:
              "Session keys allow automated rebalancing. Add via the session key module on your Safe7579 wallet.",
            deposit:
              "Choose an opportunity from the list and deposit funds through the protocol's interface or ZyFAI's aggregated interface.",
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(onboardingInfo, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error in onboarding flow: ${
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
    "get-position-summary",
    "Get a complete summary of user's positions, rebalance recommendations, and earnings",
    {
      walletAddress: z
        .string()
        .describe("The wallet address to get complete summary for"),
    },
    async ({ walletAddress }) => {
      try {
        // Fetch all relevant data in parallel
        const [portfolio, rebalanceInfo, earnings, bestPositions] =
          await Promise.allSettled([
            zyfiApi.getMultiChainPortfolio(walletAddress),
            zyfiApi.getRebalanceInfo(walletAddress),
            zyfiApi.getUserEarnings(walletAddress),
            zyfiApi.getBestPositions(walletAddress),
          ]);

        const summary = {
          walletAddress,
          timestamp: new Date().toISOString(),
          portfolio:
            portfolio.status === "fulfilled" ? portfolio.value.data : null,
          rebalanceRecommendations:
            rebalanceInfo.status === "fulfilled"
              ? rebalanceInfo.value.data
              : null,
          earnings:
            earnings.status === "fulfilled" ? earnings.value.data : null,
          bestPositions:
            bestPositions.status === "fulfilled"
              ? bestPositions.value.data
              : null,
          errors: {
            portfolio:
              portfolio.status === "rejected" ? portfolio.reason : null,
            rebalanceInfo:
              rebalanceInfo.status === "rejected" ? rebalanceInfo.reason : null,
            earnings: earnings.status === "rejected" ? earnings.reason : null,
            bestPositions:
              bestPositions.status === "rejected" ? bestPositions.reason : null,
          },
        };

        return {
          content: [
            {
              type: "text",
              text: JSON.stringify(summary, null, 2),
            },
          ],
        };
      } catch (error) {
        return {
          content: [
            {
              type: "text",
              text: `Error fetching position summary: ${
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
