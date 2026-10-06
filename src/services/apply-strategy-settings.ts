import type { Strategy, SupportedAsset, SupportedChainId } from "@zyfai/sdk";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

export type ApplyStrategyParams = {
  strategy: Strategy;
  asset?: SupportedAsset;
  chains?: SupportedChainId[];
};

export function assertNoStrategyWithExplicitProtocols(
  strategy: Strategy | undefined,
  protocols: string[] | undefined,
): void {
  if (strategy !== undefined && protocols !== undefined) {
    throw new Error(
      "Cannot set strategy and explicit protocols in the same call. Use strategy alone to auto-select protocols, or update protocols without strategy for manual configuration.",
    );
  }
}

export async function applyStrategyWithProtocols(
  zyfiApi: ZyfaiApiService,
  params: ApplyStrategyParams,
) {
  return await zyfiApi.setStrategyWithProtocols(params);
}

export async function applyNonStrategyProfileUpdates(
  zyfiApi: ZyfaiApiService,
  params: {
    asset: SupportedAsset;
    chains?: SupportedChainId[];
    protocols?: string[];
    autoSelectProtocols?: boolean;
  },
): Promise<void> {
  const { asset, chains, protocols, autoSelectProtocols } = params;
  if (
    chains === undefined &&
    protocols === undefined &&
    autoSelectProtocols === undefined
  ) {
    return;
  }
  await zyfiApi.updateUserProfile({
    asset,
    ...(chains !== undefined && { chains }),
    ...(protocols !== undefined && { protocols }),
    ...(autoSelectProtocols !== undefined && { autoSelectProtocols }),
  });
}
