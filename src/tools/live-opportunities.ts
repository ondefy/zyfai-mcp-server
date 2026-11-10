function isLiveOpportunity(row: unknown): boolean {
  if (!row || typeof row !== "object") return false;
  const status = (row as { status?: unknown }).status;
  if (typeof status !== "string") return true;
  return status === "live";
}

/** Keep rows the opportunities API marked live. Missing status is kept. */
export function onlyLiveOpportunities(data: unknown): unknown {
  if (Array.isArray(data)) return data.filter(isLiveOpportunity);
  if (!data || typeof data !== "object") return data;

  const record = data as Record<string, unknown>;
  const next: Record<string, unknown> = { ...record };
  if (Array.isArray(record.data)) {
    next.data = record.data.filter(isLiveOpportunity);
  }
  if (Array.isArray(record.opportunities)) {
    next.opportunities = record.opportunities.filter(isLiveOpportunity);
  }
  return next;
}
