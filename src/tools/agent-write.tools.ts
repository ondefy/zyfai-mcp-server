import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { requireMcpAuth, scopeIncludes } from "../auth/request-context.js";
import {
  authenticatedEoa,
  requireAuthForTool,
} from "../auth/user-scope.js";
import {
  executionChainIdSchema,
} from "../config/chains.js";
import {
  consumeEnterActionIntent,
  createEnterActionIntent,
} from "../services/enter-action-intent.js";
import type { ZyfaiApiService } from "../services/zyfai-api.service.js";
import {
  WRITE_DEPOSIT_ANNOTATIONS,
  WRITE_DESTRUCTIVE_ANNOTATIONS,
} from "./tool-annotations.js";
import { toolError, toolJsonContent } from "./tool-response.js";

/** Financial write tools (opt-in via MCP_WRITE_TOOLS_ENABLED). */
export function registerAgentWriteTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService,
) {
  server.tool(
    "enter_position",
    "Register a funded deposit after the user signed the ERC-20 transfer to their Safe.",
    {
      actionId: z.string().describe("From preview_action or prepare_enter_position"),
      chainId: executionChainIdSchema,
      txHash: z.string(),
      amount: z.string().describe("Amount in least units"),
      asset: z.enum(["USDC", "WETH", "EURC", "NVDAc"]),
      tokenAddress: z.string().optional(),
      waitForCredit: z.boolean().optional().default(true),
    },
    WRITE_DEPOSIT_ANNOTATIONS,
    async ({
      actionId,
      chainId,
      txHash,
      amount,
      asset,
      tokenAddress,
      waitForCredit,
    }) => {
      try {
        requireAuthForTool();
        if (!scopeIncludes("mcp:tools:write:deposit")) {
          return toolError("Missing scope mcp:tools:write:deposit");
        }
        const auth = requireMcpAuth();
        const intent = consumeEnterActionIntent(actionId, {
          userId: auth.userId,
          clientId: auth.clientId,
          chainId,
          asset,
          amount,
        });
        if (!intent) {
          return toolError("Invalid or expired actionId for this deposit");
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
          return toolJsonContent(
            { logged, credited, actionId },
            "Deposit registered",
          );
        }
        return toolJsonContent({ logged, actionId }, "Deposit registered");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "prepare_enter_position",
    "Build ERC-20 transfer calldata to fund the Safe; the user must sign on-chain before enter_position.",
    {
      chainId: executionChainIdSchema,
      amount: z.string(),
      asset: z.enum(["USDC", "WETH", "EURC", "NVDAc"]),
      strategy: z
        .enum(["conservative", "aggressive", "yieldmaxxing"])
        .optional(),
    },
    WRITE_DEPOSIT_ANNOTATIONS,
    async ({ chainId, amount, asset, strategy }) => {
      try {
        requireAuthForTool();
        if (!scopeIncludes("mcp:tools:write:deposit")) {
          return toolError("Missing scope mcp:tools:write:deposit");
        }
        const auth = requireMcpAuth();
        const eoa = authenticatedEoa();
        const response = await zyfiApi.prepareEnterPosition({
          userAddress: eoa,
          chainId,
          amount,
          asset,
          strategy,
        });
        const actionId = createEnterActionIntent({
          userId: auth.userId,
          clientId: auth.clientId,
          chainId,
          asset,
          amount,
          strategy,
        });
        return toolJsonContent(
          { ...response, actionId },
          "Transfer preparation",
        );
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "exit_position",
    "Withdraw from Zyfai positions back to the owner's account (not a third-party transfer).",
    {
      chainId: executionChainIdSchema,
      tokenSymbol: z.string().optional(),
      amount: z
        .string()
        .optional()
        .describe("Partial amount in least units; omit for full exit"),
    },
    WRITE_DESTRUCTIVE_ANNOTATIONS,
    async ({ chainId, tokenSymbol, amount }) => {
      try {
        requireAuthForTool();
        if (!scopeIncludes("mcp:tools:write")) {
          return toolError("Missing scope mcp:tools:write");
        }
        const eoa = authenticatedEoa();
        const response = await zyfiApi.withdrawFunds(
          eoa,
          chainId,
          amount,
          tokenSymbol,
        );
        return toolJsonContent(response, "Withdraw queued");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "customize_position",
    "Update strategy, chains, or protocols for capital already in the Safe.",
    {
      strategy: z.enum(["conservative", "aggressive", "yieldmaxxing"]),
      chains: z.array(executionChainIdSchema),
      asset: z.enum(["USDC", "WETH", "EURC", "NVDAc"]).default("USDC"),
      protocols: z.array(z.string()).optional(),
      autoSelectProtocols: z.boolean().optional(),
    },
    WRITE_DESTRUCTIVE_ANNOTATIONS,
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
        return toolJsonContent(response, "Profile updated");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );
}
