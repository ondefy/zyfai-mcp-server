import { describe, expect, it, vi } from "vitest";
import {
  consumeEnterActionIntent,
  createEnterActionIntent,
} from "./enter-action-intent.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

describe("enter-action-intent API bridge", () => {
  it("creates via execution API", async () => {
    const zyfiApi = {
      createAgentEnterIntent: vi.fn().mockResolvedValue({
        data: { actionId: "abc123", expiresAt: "2099-01-01T00:00:00.000Z" },
      }),
    } as unknown as ZyfaiApiService;
    const actionId = await createEnterActionIntent(zyfiApi, {
      chainId: 8453,
      asset: "USDC",
      amount: "1000000",
    });
    expect(actionId).toBe("abc123");
  });

  it("returns false when consume fails", async () => {
    const zyfiApi = {
      consumeAgentEnterIntent: vi.fn().mockRejectedValue(new Error("nope")),
    } as unknown as ZyfaiApiService;
    const ok = await consumeEnterActionIntent(zyfiApi, "abc", {
      chainId: 8453,
      asset: "USDC",
      amount: "1000000",
    });
    expect(ok).toBe(false);
  });
});
