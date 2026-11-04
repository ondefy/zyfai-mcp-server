import { z } from "zod";

/** Public SDK strategy tokens (UI labels: Conservative / Balanced / Advanced). */
export const publicStrategySchema = z.enum([
  "conservative",
  "balance",
  "grow",
]);

export type PublicStrategy = z.infer<typeof publicStrategySchema>;

export const PUBLIC_STRATEGY_DESCRIPTION =
  "conservative (Conservative), balance (Balanced), or grow (Advanced)";
