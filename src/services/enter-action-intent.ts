import type { SupportedAsset, SupportedChainId } from "@zyfai/sdk";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

export type EnterActionIntentParams = {
  chainId: SupportedChainId;
  asset: string;
  amount: string;
  strategy?: string;
};

export async function createEnterActionIntent(
  zyfiApi: ZyfaiApiService,
  intent: EnterActionIntentParams,
): Promise<string> {
  const { data } = await zyfiApi.createAgentEnterIntent({
    chainId: intent.chainId,
    amount: intent.amount,
    asset: intent.asset as SupportedAsset,
    strategy: intent.strategy as
      | "conservative"
      | "aggressive"
      | "yieldmaxxing"
      | undefined,
  });
  return data.actionId;
}

export async function consumeEnterActionIntent(
  zyfiApi: ZyfaiApiService,
  actionId: string,
  expected: EnterActionIntentParams,
): Promise<boolean> {
  try {
    await zyfiApi.consumeAgentEnterIntent(actionId, {
      chainId: expected.chainId,
      amount: expected.amount,
      asset: expected.asset as SupportedAsset,
    });
    return true;
  } catch {
    return false;
  }
}
