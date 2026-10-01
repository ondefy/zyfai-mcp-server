import type { SupportedAsset, SupportedChainId } from "@zyfai/sdk";
import { config } from "../config/env.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

export type EnterActionIntentParams = {
  chainId: SupportedChainId;
  asset: string;
  amount: string;
  strategy?: string;
};

export type CreatedEnterActionIntent = {
  actionId: string;
  signingTicket: string;
  signingUrl: string;
};

export function buildSigningUrl(signingTicket: string): string {
  const base = config.zyfaiWebSigningBase;
  return `${base}/agent/deposit-sign?ticket=${encodeURIComponent(signingTicket)}`;
}

export async function createEnterActionIntent(
  zyfiApi: ZyfaiApiService,
  intent: EnterActionIntentParams,
): Promise<CreatedEnterActionIntent> {
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
  return {
    actionId: data.actionId,
    signingTicket: data.signingTicket,
    signingUrl: buildSigningUrl(data.signingTicket),
  };
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
