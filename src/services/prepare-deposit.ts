import type { Strategy, SupportedAsset, SupportedChainId } from "@zyfai/sdk";
import { createEnterActionIntent } from "./enter-action-intent.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

export type PrepareDepositParams = {
  userAddress: string;
  chainId: SupportedChainId;
  amount: string;
  asset: SupportedAsset;
  strategy?: Strategy;
  clientLabel?: string;
};

/** Shared prepare_deposit orchestration for MCP and unit tests. */
export async function runPrepareDeposit(
  zyfiApi: ZyfaiApiService,
  params: PrepareDepositParams,
) {
  const { userAddress, chainId, amount, asset, strategy, clientLabel } = params;

  if (strategy !== undefined) {
    await zyfiApi.setAssetStrategy({
      asset,
      strategy,
      chains: [chainId],
    });
  }

  const response = await zyfiApi.prepareEnterPosition({
    userAddress,
    chainId,
    amount,
    asset,
    strategy,
  });

  const intent = await createEnterActionIntent(zyfiApi, {
    chainId,
    asset,
    amount,
    strategy,
    clientLabel,
  });

  return {
    ...response,
    ...(strategy !== undefined && { strategy }),
    actionId: intent.actionId,
    signingUrl: intent.signingUrl,
    nextStep:
      "Open signingUrl in the user's browser. After they sign, poll get_deposit_status with actionId until status is completed.",
  };
}
