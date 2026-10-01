import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { requireMcpAuth, scopeIncludes } from "../auth/request-context.js";
import {
  authenticatedEoa,
  requireAuthForTool,
} from "../auth/user-scope.js";
import { executionChainIdSchema } from "../config/chains.js";
import {
  chatLabelFromClientId,
  consumeEnterActionIntent,
} from "../services/enter-action-intent.js";
import { runPrepareDeposit } from "../services/prepare-deposit.js";
import type { ZyfaiApiService } from "../services/zyfai-api.service.js";
import {
  WRITE_DEPOSIT_ANNOTATIONS,
  WRITE_DESTRUCTIVE_ANNOTATIONS,
} from "./tool-annotations.js";
import { toolError, toolJsonContent } from "./tool-response.js";

const depositAssetSchema = z.enum(["USDC", "WETH", "EURC", "NVDAc"]);
const strategySchema = z.enum(["conservative", "aggressive", "yieldmaxxing"]);

/** Financial write tools (opt-in via MCP_WRITE_TOOLS_ENABLED). */
export function registerAgentWriteTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService,
) {
  const prepareDepositSchema = {
    chainId: executionChainIdSchema,
    amount: z.string().describe("Amount in least units"),
    asset: depositAssetSchema,
    strategy: strategySchema
      .optional()
      .describe(
        "Optional public strategy for this asset on chainId; updates management settings and appears on the signing page",
      ),
  };

  server.tool(
    "prepare_deposit",
    "Prepare an ERC-20 transfer into the user's Zyfai wallet. Returns transfer calldata, a deposit intent actionId, and signingUrl. Optional strategy updates management settings for this asset and chain before prepare. The user signs in a normal browser—not inside the MCP host. Then poll get_deposit_status or call register_deposit if the signing page did not register the tx.",
    prepareDepositSchema,
    WRITE_DEPOSIT_ANNOTATIONS,
    async ({ chainId, amount, asset, strategy }) => {
      try {
        requireAuthForTool();
        if (!scopeIncludes("mcp:tools:write:deposit")) {
          return toolError("Missing scope mcp:tools:write:deposit");
        }
        const eoa = authenticatedEoa();
        const payload = await runPrepareDeposit(zyfiApi, {
          userAddress: eoa,
          chainId,
          amount,
          asset,
          strategy,
          clientLabel: chatLabelFromClientId(requireMcpAuth().clientId),
        });
        return toolJsonContent(payload, "Deposit preparation");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "register_deposit",
    "Tell Zyfai the user funded their Zyfai wallet with this signed transfer. Use after prepare_deposit when the signing page did not complete registration.",
    {
      actionId: z.string().describe("From prepare_deposit only"),
      chainId: executionChainIdSchema,
      txHash: z.string(),
      amount: z.string().describe("Amount in least units"),
      asset: depositAssetSchema,
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
        const existing = await zyfiApi.getAgentEnterIntentStatus(actionId);
        if (
          existing.data.status === "completed" &&
          existing.data.depositId
        ) {
          const payload: Record<string, unknown> = {
            intent: existing.data,
            actionId,
          };
          if (waitForCredit) {
            payload.credited = await zyfiApi.waitForDepositCredit(
              existing.data.depositId,
              chainId,
            );
          }
          return toolJsonContent(payload, "Deposit already registered");
        }
        const logged = await zyfiApi.logDeposit(
          chainId,
          txHash,
          amount,
          tokenAddress,
        );
        const depositId = logged.deposit?.id;
        if (!depositId) {
          return toolError("Deposit was not accepted by the execution API");
        }
        const intent = await consumeEnterActionIntent(zyfiApi, actionId, {
          chainId,
          asset,
          amount,
          txHash,
          depositId,
        });
        if (waitForCredit) {
          const credited = await zyfiApi.waitForDepositCredit(
            depositId,
            chainId,
          );
          return toolJsonContent(
            { logged, credited, actionId, intent },
            "Deposit registered",
          );
        }
        return toolJsonContent(
          { logged, actionId, intent },
          "Deposit registered",
        );
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "update_settings",
    "Update the user's canonical Zyfai management settings (strategy, chains, protocols). Send only fields you want to change. Allocation after deposit uses these settings.",
    {
      asset: depositAssetSchema.default("USDC"),
      strategy: strategySchema.optional(),
      chains: z.array(executionChainIdSchema).optional(),
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
          asset,
          ...(strategy !== undefined && { strategy }),
          ...(chains !== undefined && { chains }),
          ...(protocols !== undefined && { protocols }),
          ...(autoSelectProtocols !== undefined && { autoSelectProtocols }),
        });
        return toolJsonContent(response, "Settings updated");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );
}
