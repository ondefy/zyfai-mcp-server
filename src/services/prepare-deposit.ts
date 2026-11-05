import {
  resolveDepositRoute,
  type SupportedAsset,
  type SupportedChainId,
} from "@zyfai/sdk";
import { createDepositIntent } from "./deposit-intent.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";
import { waitForDepositHandover } from "./wait-for-deposit-handover.js";

export type PrepareDepositParams = {
  userAddress: string;
  chainId: SupportedChainId;
  amount: string;
  asset: SupportedAsset;
  clientLabel?: string;
  /** Token the wallet spends. Omit when it already holds `asset` on `chainId`. */
  spendToken?: string;
  /** Chain the spend token is on. Defaults to `chainId`. */
  spendChainId?: number;
};

/** Shared prepare_deposit orchestration for MCP and unit tests. */
export async function runPrepareDeposit(
  zyfiApi: ZyfaiApiService,
  params: PrepareDepositParams,
) {
  const { userAddress, chainId, amount, asset, clientLabel, spendToken, spendChainId } =
    params;
  const route = resolveDepositRoute({
    chainId,
    asset,
    spendToken,
    spendChainId,
  });
  const nextStep =
    'Reply with one sentence: the amount, the chain, and a markdown link labeled "Sign the deposit" pointing at signingUrl. Do not print the raw URL or the ticket. Do not add APY, health, or balance commentary. Stop and wait. Do not call wait_for_deposit_handover, get_deposit_status, or any other tool in this turn. After the user has signed, call wait_for_deposit_handover with actionId.';

  if (route.kind !== "direct") {
    const spend = spendToken?.trim();
    if (!spend) {
      throw new Error("spendToken is required when the wallet does not hold the collateral");
    }
    const setup = await zyfiApi.ensureDepositAssetOnChain({ asset, chainId });
    const intent = await createDepositIntent(zyfiApi, {
      chainId,
      asset,
      amount,
      clientLabel,
      spend: {
        spendToken: spend,
        spendChainId: route.kind === "swap" ? route.originChainId : chainId,
      },
    });
    return {
      preswap: true as const,
      setup,
      actionId: intent.actionId,
      signingUrl: intent.signingUrl,
      nextStep,
    };
  }

  const response = await zyfiApi.prepareDeposit({
    userAddress,
    chainId,
    amount,
    asset,
  });

  const intent = await createDepositIntent(zyfiApi, {
    chainId,
    asset,
    amount,
    clientLabel,
  });

  return {
    ...response,
    actionId: intent.actionId,
    signingUrl: intent.signingUrl,
    nextStep,
  };
}

export type PrepareDepositWithHandoverOptions = {
  waitForCredit?: boolean;
  timeoutMs?: number;
};

/**
 * Prepare a deposit and start handover listening immediately (intent + optional credit).
 * Await `handover` while the user completes signingUrl in the browser.
 */
export async function runPrepareDepositWithHandover(
  zyfiApi: ZyfaiApiService,
  params: PrepareDepositParams,
  options?: PrepareDepositWithHandoverOptions,
) {
  const prepared = await runPrepareDeposit(zyfiApi, params);
  const handover = waitForDepositHandover(zyfiApi, {
    actionId: prepared.actionId,
    chainId: params.chainId,
    waitForCredit: options?.waitForCredit ?? true,
    timeoutMs: options?.timeoutMs,
  });
  return { ...prepared, handover };
}
