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
import { ZyfaiApiService } from "../services/zyfai-api.service.js";
import { waitForDepositHandover } from "../services/wait-for-deposit-handover.js";
import { buildOpportunityId } from "./opportunity-id.js";
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

function enrichOpportunitiesPayload(
  data: unknown,
  strategy: string,
): unknown {
  if (Array.isArray(data)) {
    return data.map((row) => {
      const r = row as Record<string, unknown>;
      const chainId = Number(r.chainId ?? r.chain_id ?? 0);
      return {
        ...r,
        opportunityId: buildOpportunityId({
          chainId,
          poolId: String(r.poolId ?? r.pool_id ?? ""),
          poolAddress: String(r.poolAddress ?? r.pool_address ?? ""),
          protocol: String(r.protocol ?? r.protocolName ?? ""),
          strategy,
        }),
      };
    });
  }
  if (data && typeof data === "object" && "opportunities" in data) {
    const container = data as { opportunities: unknown[] };
    return {
      ...data,
      opportunities: enrichOpportunitiesPayload(
        container.opportunities,
        strategy,
      ),
    };
  }
  return data;
}

export function registerAgentTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService,
) {
  server.tool(
    "get_account",
    "Get the authenticated user's Zyfai profile (strategy, chains, smart wallet).",
    {},
    READ_TOOL_ANNOTATIONS,
    async () => {
      try {
        requireAuthForTool();
        requireReadScope();
        const response = await zyfiApi.getUserDetails("USDC");
        return toolJsonContent(response, "Zyfai account profile");
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
    {},
    READ_TOOL_ANNOTATIONS,
    async () => {
      try {
        requireAuthForTool();
        requireReadScope();
        const eoa = authenticatedEoa();
        const response = await zyfiApi.getPortfolio(eoa);
        return toolJsonContent(response, "Portfolio summary");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "get_positions",
    "Active DeFi positions for the authenticated user. Optional chain filter.",
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
        return toolJsonContent(response, "Active positions");
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "find_opportunities",
    "Discover yield opportunities Zyfai currently tracks. Informational only—funding uses prepare_deposit; allocation follows the user's Zyfai settings.",
    {
      strategy: z
        .enum(["conservative", "aggressive"])
        .default("conservative"),
      chainId: executionChainIdSchema.optional(),
    },
    READ_TOOL_ANNOTATIONS,
    async ({ strategy, chainId }) => {
      try {
        const response =
          strategy === "conservative"
            ? await zyfiApi.getConservativeOpportunities(chainId)
            : await zyfiApi.getAggressiveOpportunities(chainId);
        const enriched = enrichOpportunitiesPayload(response, strategy);
        return toolJsonContent(enriched, `${strategy} opportunities`);
      } catch (error) {
        return toolError(
          error instanceof Error ? error.message : "Unknown error",
        );
      }
    },
  );

  server.tool(
    "compare_opportunities",
    "Rank two strategies on the same chain for side-by-side comparison.",
    {
      chainId: executionChainIdSchema,
    },
    READ_TOOL_ANNOTATIONS,
    async ({ chainId }) => {
      try {
        const [conservative, aggressive] = await Promise.all([
          zyfiApi.getConservativeOpportunities(chainId),
          zyfiApi.getAggressiveOpportunities(chainId),
        ]);
        return toolJsonContent(
          {
            chainId,
            conservative: enrichOpportunitiesPayload(
              conservative,
              "conservative",
            ),
            aggressive: enrichOpportunitiesPayload(aggressive, "aggressive"),
          },
          "Strategy comparison",
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
    "Simulate where funds would be allocated before any on-chain action.",
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
    READ_TOOL_ANNOTATIONS,
    async ({ amount, token, networks, strategy, minSplit }) => {
      try {
        requireAuthForTool();
        requireReadScope();
        const response = await zyfiApi.simulateBestPositions({
          amount,
          token,
          networks,
          strategy,
          minSplit,
        });
        return toolJsonContent(
          { simulation: response },
          "Allocation preview",
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
    "Get the user's Zyfai settings. Includes opportunityRebalanceEnabled, manual targets, suspendedReason, and unconfiguredChains. Percentages are per chain. A suspended vault stays idle until the user saves again.",
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
    "Block until a credited deposit is allocated to a protocol position, skipped, failed, or (for cross-chain) the bridge execution tx is recorded. Call after wait_for_deposit_handover or register_deposit when waitForCredit succeeded. Destination-chain allocation is not tracked on cross-chain deposits.",
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
        return toolJsonContent(status, "Deposit position outcome");
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
