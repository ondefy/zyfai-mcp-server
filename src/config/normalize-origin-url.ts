/** Trim whitespace and strip a trailing slash from API origin env values. */
export function normalizeOriginUrl(value?: string): string | undefined {
  const trimmed = value?.trim();
  if (!trimmed) {
    return undefined;
  }
  return trimmed.replace(/\/$/, "");
}
