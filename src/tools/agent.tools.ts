/**
 * Agent-oriented MCP tools (stable intent surface).
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import {
  assertEoaMatches,
  requireMcpAuth,
  scopeIncludes,
} from "../auth/request-context.js";
import { executionChainIdSchema } from "../config/chains.js";
import { config } from "../config/env.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

function toolError(message: string) {
  return {
    content: [{ type: "text" as const, text: message }],
    isError: true,
  };
}

function requireAuthForTool(): void {
  if (config.mcpAuthRequired) {
    requireMcpAuth();
  }
}

export function registerAgentTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService,
) {
  server.tool(
    "get_account",
    "Get the authenticated user's Zyfai profile (strategy, chains, smart wallet). Requires MCP OAuth.",
    {},
    async () => {
      try {
        requireAuthForTool();
        const response = await zyfiApi.getUserDetails("USDC");
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_portfolio",
    "Portfolio for the authenticated user (positions, idle balances, async redemptions).",
    {
      userAddress: z
        .string()
        .optional()
        .describe("EOA; must match OAuth wallet when provided"),
    },
    async ({ userAddress }) => {
      try {
        requireAuthForTool();
        const auth = requireMcpAuth();
        const eoa = userAddress || auth.eoa;
        assertEoaMatches(eoa);
        const response = await zyfiApi.getPortfolio(eoa);
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "find_opportunities",
    "Discover yield opportunities by strategy and optional chain filter.",
    {
      strategy: z
        .enum(["conservative", "aggressive"])
        .default("conservative"),
      chainId: executionChainIdSchema.optional(),
    },
    async ({ strategy, chainId }) => {
      try {
        const response =
          strategy === "conservative"
            ? await zyfiApi.getConservativeOpportunities(chainId)
            : await zyfiApi.getAggressiveOpportunities(chainId);
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "simulate_action",
    "Simulate best-position allocation for an amount (read-only planning).",
    {
      amount: z.number().describe("Amount in USD (human units)"),
      token: z.string().describe("Asset symbol e.g. USDC"),
      networks: z.union([
        executionChainIdSchema,
        z.array(executionChainIdSchema),
      ]),
      strategy: z.enum(["conservative", "aggressive", "yieldmaxxing"]),
      minSplit: z.number().optional(),
    },
    async ({ amount, token, networks, strategy, minSplit }) => {
      try {
        requireAuthForTool();
        const response = await zyfiApi.simulateBestPositions({
          amount,
          token,
          networks,
          strategy,
          minSplit,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "configure_position",
    "Update strategy/chains/protocols before funding (JWT write).",
    {
      strategy: z.enum(["conservative", "aggressive", "yieldmaxxing"]),
      chains: z.array(executionChainIdSchema),
      asset: z.enum(["USDC", "WETH", "EURC", "NVDAc"]).default("USDC"),
      protocols: z.array(z.string()).optional(),
      autoSelectProtocols: z.boolean().optional(),
    },
    async ({ strategy, chains, asset, protocols, autoSelectProtocols }) => {
      try {
        requireAuthForTool();
        if (!scopeIncludes("mcp:tools:write:configure")) {
          return toolError("Missing scope mcp:tools:write:configure");
        }
        const response = await zyfiApi.updateUserProfile({
          strategy,
          chains,
          asset,
          protocols,
          autoSelectProtocols,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "prepare_deposit",
    "Build ERC-20 transfer calldata to fund the Safe; user must sign on-chain.",
    {
      userAddress: z.string().optional(),
      chainId: executionChainIdSchema,
      amount: z.string().describe("Amount in least units (string integer)"),
      asset: z.enum(["USDC", "WETH", "EURC", "NVDAc"]),
      strategy: z
        .enum(["conservative", "aggressive", "yieldmaxxing"])
        .optional(),
    },
    async ({ userAddress, chainId, amount, asset, strategy }) => {
      try {
        requireAuthForTool();
        if (!scopeIncludes("mcp:tools:write:deposit")) {
          return toolError("Missing scope mcp:tools:write:deposit");
        }
        const auth = requireMcpAuth();
        const eoa = userAddress || auth.eoa;
        assertEoaMatches(eoa);
        const response = await zyfiApi.prepareEnterPosition({
          userAddress: eoa,
          chainId,
          amount,
          asset,
          strategy,
        });
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "submit_deposit",
    "Register an on-chain deposit after the user signed the ERC-20 transfer.",
    {
      chainId: executionChainIdSchema,
      txHash: z.string(),
      amount: z.string(),
      tokenAddress: z.string().optional(),
      waitForCredit: z.boolean().optional().default(true),
    },
    async ({ chainId, txHash, amount, tokenAddress, waitForCredit }) => {
      try {
        requireAuthForTool();
        if (!scopeIncludes("mcp:tools:write:deposit")) {
          return toolError("Missing scope mcp:tools:write:deposit");
        }
        const logged = await zyfiApi.logDeposit(
          chainId,
          txHash,
          amount,
          tokenAddress,
        );
        if (waitForCredit && logged.deposit?.id) {
          const credited = await zyfiApi.waitForDepositCredit(
            logged.deposit.id,
            chainId,
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({ logged, credited }, null, 2),
              },
            ],
          };
        }
        return {
          content: [{ type: "text", text: JSON.stringify(logged, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_management_permissions",
    "Get agent autonomy mandate (capital caps, allowed chains/assets, withdraw/rebalance flags).",
    {},
    async () => {
      try {
        requireAuthForTool();
        const response = await zyfiApi.getAgentMandate();
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "set_management_permissions",
    "Set or update agent autonomy mandate for delegated management.",
    {
      maxCapitalUsd: z.string().nullable().optional(),
      allowedChainIds: z.array(executionChainIdSchema).optional(),
      allowedAssets: z.array(z.string()).optional(),
      allowRebalance: z.boolean().optional(),
      allowWithdraw: z.boolean().optional(),
      expiresAt: z.string().nullable().optional(),
    },
    async (body) => {
      try {
        requireAuthForTool();
        if (!scopeIncludes("mcp:tools:write")) {
          return toolError("Missing scope mcp:tools:write");
        }
        const response = await zyfiApi.setAgentMandate(body);
        return {
          content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_deposit_status",
    "Poll deposit handover/credit lifecycle for a deposit id.",
    {
      depositId: z.string(),
    },
    async ({ depositId }) => {
      try {
        requireAuthForTool();
        const status = await zyfiApi.getDepositStatus(depositId);
        return {
          content: [{ type: "text", text: JSON.stringify(status, null, 2) }],
        };
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );
}
