import { z } from "zod";
import type { Strategy } from "@zyfai/sdk";

/** Public strategy tiers exposed on MCP tool schemas (matches docs.zyf.ai). */
export const publicStrategySchema = z.enum([
  "conservative",
  "balanced",
  "advanced",
]);

export type PublicStrategyTier = z.infer<typeof publicStrategySchema>;

/** @zyfai/sdk still types the execution API as legacy public names until the next SDK release. */
export function publicTierToSdk(tier: PublicStrategyTier): Strategy {
  switch (tier) {
    case "conservative":
      return "conservative";
    case "balanced":
      return "aggressive";
    case "advanced":
      return "yieldmaxxing";
  }
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
