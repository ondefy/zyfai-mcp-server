import { describe, expect, it, vi } from "vitest";
import {
  buildSigningUrl,
  consumeEnterActionIntent,
  createEnterActionIntent,
} from "./enter-action-intent.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

describe("enter-action-intent API bridge", () => {
  it("builds signing URL with ticket query", () => {
    const url = buildSigningUrl("ticket-abc");
    expect(url).toContain("/agent/deposit-sign?ticket=");
    expect(url).toContain("ticket-abc");
  });

  it("creates via execution API", async () => {
    const zyfiApi = {
      createAgentEnterIntent: vi.fn().mockResolvedValue({
        data: {
          actionId: "abc123",
          expiresAt: "2099-01-01T00:00:00.000Z",
          signingTicket: "ticket-xyz",
        },
      }),
    } as unknown as ZyfaiApiService;
    const result = await createEnterActionIntent(zyfiApi, {
      chainId: 8453,
      asset: "USDC",
      amount: "1000000",
    });
    expect(result.actionId).toBe("abc123");
    expect(result.signingUrl).toContain("ticket-xyz");
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
