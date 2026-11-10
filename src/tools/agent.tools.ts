/**
 * Portable read/preview MCP tools (host-agnostic).
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { getMcpAuth, scopeIncludes } from "../auth/request-context.js";
import {
  authenticatedEoa,
  requireAuthForTool,
} from "../auth/user-scope.js";
import {
  executionChainIdSchema,
  optionalChainIdSchema,
  CHAIN_ID_DESCRIPTION,
} from "../config/chains.js";
import {
  publicStrategySchema,
  publicTierToSdk,
  type PublicStrategyTier,
} from "../config/strategies.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";
import { waitForDepositHandover } from "../services/wait-for-deposit-handover.js";
import {
  portfolioBody,
  speakAccount,
  speakCompare,
  speakDepositLanded,
  speakPortfolio,
  speakSimulation,
  strategyFromSettings,
} from "./plain-reply.js";
import { READ_TOOL_ANNOTATIONS } from "./tool-annotations.js";
import { toolError, toolJsonContent } from "./tool-response.js";

function requireReadScope(): void {
  const auth = getMcpAuth();
  if (!auth) {
    return;
  }
  if (!scopeIncludes("mcp:tools:read")) {
    throw new Error("Missing scope mcp:tools:read");
  }
}

const ASK_AMOUNT = "How much, and on which chain?";

const findStrategySchema = z.enum(["conservative", "balanced"]);

async function savedStrategy(
  zyfiApi: ZyfaiApiService,
): Promise<PublicStrategyTier> {
  try {
    return strategyFromSettings(await zyfiApi.getAssetTypeSettings()) ?? "conservative";
  } catch {
    return "conservative";
  }
}

export function registerAgentTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService,
) {
  server.tool(
    "get_account",
    "Say only the reply. It names the chains that can take a deposit.",
    {},
    READ_TOOL_ANNOTATIONS,
    async () => {
      try {
        requireAuthForTool();
        requireReadScope();
        const response = await zyfiApi.getUserDetails("USDC");
        return toolJsonContent(response, undefined, speakAccount(response));
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_portfolio",
    "Say only the reply. It names positions and any idle amount.",
    {},
    READ_TOOL_ANNOTATIONS,
    async () => {
      try {
        requireAuthForTool();
        requireReadScope();
        const eoa = authenticatedEoa();
        const response = await zyfiApi.getPortfolio(eoa);
        return toolJsonContent(
          response,
          undefined,
          speakPortfolio(portfolioBody(response)),
        );
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_positions",
    "Say only the reply. It names each position and its rate.",
    {
      chainId: optionalChainIdSchema.describe(
        `Optional chain ID. ${CHAIN_ID_DESCRIPTION}`,
      ),
    },
    READ_TOOL_ANNOTATIONS,
    async ({ chainId }) => {
      try {
        requireAuthForTool();
        requireReadScope();
        const eoa = authenticatedEoa();
        const response = await zyfiApi.getPositions(eoa, chainId);
        return toolJsonContent(
          response,
          undefined,
          speakPortfolio(portfolioBody(response)),
        );
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "find_opportunities",
    "Say only the reply. It names where this amount would go, and the rate. When the amount or the chain is missing, the reply asks for both.",
    {
      amount: z
        .number()
        .positive()
        .optional()
        .describe("Amount in the asset. 10 means 10 USDC"),
      token: z.string().optional().describe("Asset symbol, default USDC"),
      strategy: findStrategySchema.optional(),
      chainId: executionChainIdSchema.optional(),
    },
    READ_TOOL_ANNOTATIONS,
    async ({ amount, token, strategy, chainId }) => {
      try {
        if (amount === undefined || chainId === undefined) {
          return toolJsonContent({}, undefined, ASK_AMOUNT);
        }
        requireAuthForTool();
        requireReadScope();
        const asset = token ?? "USDC";
        const chosen = strategy ?? (await savedStrategy(zyfiApi));
        const response = await zyfiApi.simulateBestPositions({
          amount,
          token: asset,
          networks: chainId,
          strategy: publicTierToSdk(chosen),
        });
        return toolJsonContent(
          { positions: response.data },
          undefined,
          speakSimulation(response, amount, asset),
        );
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "compare_opportunities",
    "Say only the reply. It names the pool each strategy would use, and its rate. When the amount is missing, the reply asks for the amount and the chain.",
    {
      amount: z
        .number()
        .positive()
        .optional()
        .describe("Amount in the asset. 10 means 10 USDC"),
      token: z.string().optional().describe("Asset symbol, default USDC"),
      chainId: executionChainIdSchema,
    },
    READ_TOOL_ANNOTATIONS,
    async ({ amount, token, chainId }) => {
      try {
        if (amount === undefined) {
          return toolJsonContent({}, undefined, ASK_AMOUNT);
        }
        requireAuthForTool();
        requireReadScope();
        const asset = token ?? "USDC";
        const [conservative, balanced] = await Promise.all([
          zyfiApi.simulateBestPositions({
            amount,
            token: asset,
            networks: chainId,
            strategy: "conservative",
          }),
          zyfiApi.simulateBestPositions({
            amount,
            token: asset,
            networks: chainId,
            strategy: "aggressive",
          }),
        ]);
        return toolJsonContent(
          {
            conservative: conservative.data,
            balanced: balanced.data,
          },
          undefined,
          speakCompare(
            speakSimulation(conservative, amount, asset),
            speakSimulation(balanced, amount, asset),
          ),
        );
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "preview_action",
    "Say only the reply. It names where this amount would go, and the rate.",
    {
      amount: z.number().describe("Amount in the asset. 10 means 10 USDC"),
      token: z.string().describe("Asset symbol e.g. USDC"),
      networks: z.union([
        executionChainIdSchema,
        z.array(executionChainIdSchema),
      ]),
      strategy: publicStrategySchema.optional(),
      minSplit: z.number().optional(),
    },
    READ_TOOL_ANNOTATIONS,
    async ({ amount, token, networks, strategy, minSplit }) => {
      try {
        requireAuthForTool();
        requireReadScope();
        const chosen = strategy ?? (await savedStrategy(zyfiApi));
        const response = await zyfiApi.simulateBestPositions({
          amount,
          token,
          networks,
          strategy: publicTierToSdk(chosen),
          minSplit,
        });
        return toolJsonContent(
          { positions: response.data },
          undefined,
          speakSimulation(response, amount, token),
        );
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_settings",
    "Get the user's canonical Zyfai management settings (per-asset strategy, chains, protocols).",
    {},
    READ_TOOL_ANNOTATIONS,
    async () => {
      try {
        requireAuthForTool();
        requireReadScope();
        const settings = await zyfiApi.getAssetTypeSettings();
        return toolJsonContent(settings, "Zyfai settings");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "wait_for_deposit_handover",
    "Monitor an in-flight deposit after the user has been shown the signingUrl from prepare_deposit and asked to open it. Do not call this in the same turn as prepare_deposit. Block until the user finishes signing (intent completed) and optionally until custody credit.",
    {
      actionId: z.string().describe("actionId from prepare_deposit"),
      chainId: executionChainIdSchema,
      waitForCredit: z.boolean().optional().default(true),
      timeoutMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Max wait in ms (default matches intent TTL, 30 minutes)"),
    },
    READ_TOOL_ANNOTATIONS,
    async ({ actionId, chainId, waitForCredit, timeoutMs }) => {
      try {
        requireAuthForTool();
        requireReadScope();
        const result = await waitForDepositHandover(zyfiApi, {
          actionId,
          chainId,
          waitForCredit,
          timeoutMs,
        });
        return toolJsonContent(result, "Deposit handover complete");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  const lifecyclePollOptionsSchema = {
    timeoutMs: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Max wait in ms (SDK chain defaults apply when omitted)"),
    intervalMs: z
      .number()
      .int()
      .positive()
      .optional()
      .describe("Poll interval in ms"),
  };

  server.tool(
    "get_deposit_status",
    "Poll deposit progress. Pass actionId after prepare_deposit (intent status), or depositId after registration (handover, credit, and allocation lifecycle). After credit, use wait_for_deposit_position when the user needs funds allocated to a protocol.",
    {
      actionId: z.string().optional(),
      depositId: z.string().optional(),
    },
    READ_TOOL_ANNOTATIONS,
    async ({ actionId, depositId }) => {
      try {
        requireAuthForTool();
        requireReadScope();
        if (actionId && depositId) {
          return toolError("Provide actionId or depositId, not both");
        }
        if (actionId) {
          const { data } = await zyfiApi.getAgentDepositIntentStatus(actionId);
          return toolJsonContent(data, "Deposit intent status");
        }
        if (depositId) {
          const status = await zyfiApi.getDepositStatus(depositId);
          return toolJsonContent(status, "Deposit lifecycle status");
        }
        return toolError("actionId or depositId is required");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "wait_for_deposit_position",
    "Say only the reply. It names where the deposit landed, and the rate.",
    {
      depositId: z.string().describe("depositId from handover or register_deposit"),
      chainId: executionChainIdSchema,
      ...lifecyclePollOptionsSchema,
    },
    READ_TOOL_ANNOTATIONS,
    async ({ depositId, chainId, timeoutMs, intervalMs }) => {
      try {
        requireAuthForTool();
        requireReadScope();
        const status = await zyfiApi.waitForDepositPosition(depositId, chainId, {
          timeoutMs,
          intervalMs,
        });
        let reply = "The deposit is in.";
        const landed =
          status.status === "positioned" || status.positionOutcome === "positioned";
        if (landed) {
          try {
            const positions = await zyfiApi.getPositions(
              authenticatedEoa(),
              chainId,
            );
            reply = speakDepositLanded(positions);
          } catch {
            reply = "The deposit is in.";
          }
        }
        return toolJsonContent(status, undefined, reply);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_withdraw_status",
    "Poll withdraw lifecycle progress. Pass withdrawalId from the lifecycle.id field on withdraw or register_withdraw when present.",
    {
      withdrawalId: z.string(),
    },
    READ_TOOL_ANNOTATIONS,
    async ({ withdrawalId }) => {
      try {
        requireAuthForTool();
        requireReadScope();
        const status = await zyfiApi.getWithdrawStatus(withdrawalId);
        return toolJsonContent(status, "Withdraw lifecycle status");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "wait_for_withdraw_settlement",
    "Short poll after withdraw: completes when the sync slice settles, async enters cooldown, or claim is already in flight (resume/retry). Use lifecycle.id from withdraw. Follow with wait_for_withdraw_complete for async vault legs.",
    {
      withdrawalId: z.string(),
      chainId: executionChainIdSchema,
      ...lifecyclePollOptionsSchema,
    },
    READ_TOOL_ANNOTATIONS,
    async ({ withdrawalId, chainId, timeoutMs, intervalMs }) => {
      try {
        requireAuthForTool();
        requireReadScope();
        const status = await zyfiApi.waitForWithdrawSettlement(
          withdrawalId,
          chainId,
          { timeoutMs, intervalMs },
        );
        return toolJsonContent(status, "Withdraw settlement phase complete");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "wait_for_withdraw_complete",
    "Long poll through async cooldown and claim until the withdraw lifecycle is completed. Use after wait_for_withdraw_settlement when async legs may remain.",
    {
      withdrawalId: z.string(),
      chainId: executionChainIdSchema,
      timeoutMs: lifecyclePollOptionsSchema.timeoutMs,
      intervalMs: lifecyclePollOptionsSchema.intervalMs,
      cooldownIntervalMs: z
        .number()
        .int()
        .positive()
        .optional()
        .describe("Poll interval while in async cooldown"),
    },
    READ_TOOL_ANNOTATIONS,
    async ({
      withdrawalId,
      chainId,
      timeoutMs,
      intervalMs,
      cooldownIntervalMs,
    }) => {
      try {
        requireAuthForTool();
        requireReadScope();
        const status = await zyfiApi.waitForWithdrawComplete(
          withdrawalId,
          chainId,
          { timeoutMs, intervalMs, cooldownIntervalMs },
        );
        return toolJsonContent(status, "Withdraw complete");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );
}
