import type { SupportedAsset, SupportedChainId } from "@zyfai/sdk";
import { createDepositIntent } from "./deposit-intent.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";
import { waitForDepositHandover } from "./wait-for-deposit-handover.js";

export type PrepareDepositParams = {
  userAddress: string;
  chainId: SupportedChainId;
  amount: string;
  asset: SupportedAsset;
  clientLabel?: string;
};

/** Shared prepare_deposit orchestration for MCP and unit tests. */
export async function runPrepareDeposit(
  zyfiApi: ZyfaiApiService,
  params: PrepareDepositParams,
) {
  const { userAddress, chainId, amount, asset, clientLabel } = params;

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
    nextStep:
      "Open signingUrl in the user's browser. In the same turn, call wait_for_deposit_handover with actionId (or poll get_deposit_status) while the user signs.",
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
