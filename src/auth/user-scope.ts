import type { SupportedAsset } from "@zyfai/sdk";
import type { ZyfaiApiService } from "../services/zyfai-api.service.js";
import { requireMcpAuth } from "./request-context.js";

/** Personal and write tools always need a user session, including when HTTP auth is optional. */
export function requireAuthForTool(): void {
  requireMcpAuth();
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
