export function buildOpportunityId(parts: {
  chainId: number;
  poolId?: string;
  poolAddress?: string;
  strategy?: string;
  protocol?: string;
}): string {
  const pool =
    parts.poolId ??
    parts.poolAddress ??
    parts.protocol ??
    "unknown";
  const strategy = parts.strategy ?? "unknown";
  return `${parts.chainId}:${pool}:${strategy}`;
}

export function withOpportunityIds<T extends Record<string, unknown>>(
  rows: T[],
  pick: (row: T) => {
    chainId: number;
    poolId?: string;
    poolAddress?: string;
    strategy?: string;
    protocol?: string;
  },
): (T & { opportunityId: string })[] {
  return rows.map((row) => ({
    ...row,
    opportunityId: buildOpportunityId(pick(row)),
  }));
}
