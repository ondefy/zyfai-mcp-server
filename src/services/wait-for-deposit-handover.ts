import type { SupportedChainId } from "@zyfai/sdk";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

export type WaitForDepositHandoverParams = {
  actionId: string;
  chainId: SupportedChainId;
  waitForCredit?: boolean;
  timeoutMs?: number;
};

export async function waitForDepositHandover(
  zyfiApi: ZyfaiApiService,
  params: WaitForDepositHandoverParams,
) {
  const { actionId, chainId, waitForCredit = true, timeoutMs } = params;
  return zyfiApi.waitForAgentDepositHandover(actionId, chainId, {
    waitForCredit,
    timeoutMs,
  });
}
