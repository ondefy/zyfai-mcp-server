import type { SupportedAsset } from "@zyfai/sdk";
import { config } from "../config/env.js";
import type { ZyfaiApiService } from "../services/zyfai-api.service.js";
import { requireMcpAuth } from "./request-context.js";

export function requireAuthForTool(): void {
  if (config.mcpAuthRequired) {
    requireMcpAuth();
  }
}

export function authenticatedEoa(): string {
  requireAuthForTool();
  return requireMcpAuth().eoa;
}

/** Smart wallet for the MCP session user from execution API `/users/me`. */
export async function resolveSessionSmartWallet(
  zyfiApi: ZyfaiApiService,
  asset: SupportedAsset = "USDC",
): Promise<string> {
  requireAuthForTool();
  requireMcpAuth();
  const details = await zyfiApi.getUserDetails(asset);
  const smartWallet = details.smartWallet;
  if (!smartWallet) {
    throw new Error(
      "No smart wallet assigned for this account yet. Complete onboarding or deposit first.",
    );
  }
  return smartWallet;
}
