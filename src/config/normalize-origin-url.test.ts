import { describe, expect, it } from "vitest";
import { normalizeOriginUrl } from "./normalize-origin-url.js";

describe("normalizeOriginUrl", () => {
  it("trims surrounding whitespace before stripping a trailing slash", () => {
    expect(normalizeOriginUrl("https://api.zyf.ai   ")).toBe("https://api.zyf.ai");
    expect(normalizeOriginUrl("  https://api.zyf.ai/  ")).toBe("https://api.zyf.ai");
  });

  it("returns undefined for empty or whitespace-only values", () => {
    expect(normalizeOriginUrl(undefined)).toBeUndefined();
    expect(normalizeOriginUrl("   ")).toBeUndefined();
  });
});
