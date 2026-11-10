import { z } from "zod";
import type { Strategy } from "@zyfai/sdk";

/** Public strategy tiers exposed on MCP tool schemas (matches docs.zyf.ai and `@zyfai/sdk`). */
export const publicStrategySchema = z.enum([
  "conservative",
  "balanced",
  "advanced",
]);

export type PublicStrategyTier = z.infer<typeof publicStrategySchema>;

export function publicTierToSdk(tier: PublicStrategyTier): Strategy {
  return tier;
}

const INTERNAL_TO_PUBLIC: Record<string, PublicStrategyTier> = {
  conservative: "conservative",
  safe: "conservative",
  safe_strategy: "conservative",
  balanced: "balanced",
  balance: "balanced",
  aggressive: "balanced",
  degen: "balanced",
  degen_strategy: "balanced",
  advanced: "advanced",
  grow: "advanced",
  yieldmaxxing: "advanced",
  async: "advanced",
  async_strategy: "advanced",
};

export function internalStrategyToPublicTier(
  raw: string | undefined | null,
): PublicStrategyTier | undefined {
  if (!raw) return undefined;
  return INTERNAL_TO_PUBLIC[raw.toLowerCase()];
}
