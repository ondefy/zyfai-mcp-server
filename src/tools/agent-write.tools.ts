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
  createEnterActionIntent,
} from "../services/enter-action-intent.js";
import type { ZyfaiApiService } from "../services/zyfai-api.service.js";
import {
  WRITE_DEPOSIT_ANNOTATIONS,
  WRITE_DESTRUCTIVE_ANNOTATIONS,
} from "./tool-annotations.js";
import { toolError, toolJsonContent } from "./tool-response.js";

const depositAssetSchema = z.enum(["USDC", "WETH", "EURC", "NVDAc"]);

/** Financial write tools (opt-in via MCP_WRITE_TOOLS_ENABLED). */
export function registerAgentWriteTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService,
) {
  const prepareDepositSchema = {
    chainId: executionChainIdSchema,
    amount: z.string().describe("Amount in least units"),
    asset: depositAssetSchema,
  };

  server.tool(
    "prepare_deposit",
    "Prepare an ERC-20 transfer into the user's Zyfai wallet. Returns transfer calldata, a deposit intent actionId, and signingUrl. The user signs in a normal browser—not inside the MCP host. Then poll get_deposit_status or call register_deposit if the signing page did not register the tx.",
    prepareDepositSchema,
    WRITE_DEPOSIT_ANNOTATIONS,
    async ({ chainId, amount, asset }) => {
      try {
        requireAuthForTool();
        if (!scopeIncludes("mcp:tools:write:deposit")) {
          return toolError("Missing scope mcp:tools:write:deposit");
        }
        const eoa = authenticatedEoa();
        const response = await zyfiApi.prepareEnterPosition({
          userAddress: eoa,
          chainId,
          amount,
          asset,
        });
        const intent = await createEnterActionIntent(zyfiApi, {
          chainId,
          asset,
          amount,
          clientLabel: chatLabelFromClientId(requireMcpAuth().clientId),
        });
        return toolJsonContent(
          {
            ...response,
            actionId: intent.actionId,
            signingUrl: intent.signingUrl,
            nextStep:
              "Open signingUrl in the user's browser. After they sign, poll get_deposit_status with actionId until status is completed.",
          },
          "Deposit preparation",
        );
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
        const consumed = await consumeEnterActionIntent(zyfiApi, actionId, {
          chainId,
          asset,
          amount,
        });
        if (!consumed) {
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

  const strategySchema = z.enum(["conservative", "aggressive", "yieldmaxxing"]);

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
