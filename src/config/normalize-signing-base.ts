/**
 * Origin for zyf.ai `/agent/deposit-sign` links from `prepare_deposit`.
 * Local monorepo dev serves HTTPS (mkcert); `http://localhost:4004` in .env
 * is a common misconfiguration and breaks wallet / page load.
 */
export function normalizeZyfaiWebSigningBase(raw?: string): string {
  const fallback = "https://zyf.ai";
  const trimmed = raw?.trim().replace(/\/$/, "");
  if (!trimmed) return fallback;

  try {
    const url = new URL(trimmed);
    const isLoopback =
      url.hostname === "localhost" || url.hostname === "127.0.0.1";
    if (isLoopback && url.protocol === "http:") {
      url.protocol = "https:";
    }
    return url.origin;
  } catch {
    return trimmed;
  }
}
