import { describe, expect, it, vi } from "vitest";
import {
  applyStrategyWithProtocols,
  assertNoStrategyWithExplicitProtocols,
} from "./apply-strategy-settings.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

describe("assertNoStrategyWithExplicitProtocols", () => {
  it("throws when strategy and protocols are both set", () => {
    expect(() =>
      assertNoStrategyWithExplicitProtocols("yieldmaxxing", ["aave"]),
    ).toThrow(/Cannot set strategy and explicit protocols/);
  });

  it("allows strategy without protocols", () => {
    expect(() =>
      assertNoStrategyWithExplicitProtocols("conservative", undefined),
    ).not.toThrow();
  });
});

describe("applyStrategyWithProtocols", () => {
  it("delegates to ZyfaiApiService.setStrategyWithProtocols", async () => {
    const setStrategyWithProtocols = vi.fn().mockResolvedValue([{ success: true }]);
    const zyfiApi = {
      setStrategyWithProtocols,
    } as unknown as ZyfaiApiService;

    await applyStrategyWithProtocols(zyfiApi, {
      strategy: "aggressive",
      asset: "USDC",
    });

    expect(setStrategyWithProtocols).toHaveBeenCalledWith({
      strategy: "aggressive",
      asset: "USDC",
    });
  });

  it("omits asset to let the SDK apply all managed assets", async () => {
    const setStrategyWithProtocols = vi.fn().mockResolvedValue([]);
    const zyfiApi = {
      setStrategyWithProtocols,
    } as unknown as ZyfaiApiService;

    await applyStrategyWithProtocols(zyfiApi, { strategy: "yieldmaxxing" });

    expect(setStrategyWithProtocols).toHaveBeenCalledWith({
      strategy: "yieldmaxxing",
    });
  });
});
