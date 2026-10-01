import { describe, expect, it, vi } from "vitest";
import {
  buildSigningUrl,
  chatLabelFromClientId,
  consumeEnterActionIntent,
  createEnterActionIntent,
} from "./enter-action-intent.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

describe("enter-action-intent API bridge", () => {
  it("builds signing URL with ticket query", () => {
    const url = buildSigningUrl("ticket-abc");
    expect(url).toContain("/agent/deposit-sign?ticket=");
    expect(url).toContain("ticket-abc");
    expect(url).not.toContain("client=");
  });

  it("names the chat on the signing URL when the client is known", () => {
    const url = buildSigningUrl("ticket-abc", "Grok");
    expect(url).toContain("client=Grok");
    expect(chatLabelFromClientId("https://grok.com/oauth/client.json")).toBe(
      "Grok",
    );
    expect(chatLabelFromClientId("dyn_unknown")).toBeUndefined();
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
