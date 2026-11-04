import { z } from "zod";

/** Public SDK strategy tokens (same strings as product tier names, lowercased). */
export const publicStrategySchema = z.enum([
  "conservative",
  "balanced",
  "advanced",
]);

export type PublicStrategy = z.infer<typeof publicStrategySchema>;

export const PUBLIC_STRATEGY_DESCRIPTION =
  "conservative, balanced, or advanced";
