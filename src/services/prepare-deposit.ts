import type { SupportedAsset, SupportedChainId } from "@zyfai/sdk";
import { createDepositIntent } from "./deposit-intent.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

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
      "Open signingUrl in the user's browser. After they sign, poll get_deposit_status with actionId until status is completed.",
  };
}
