import { describe, expect, it, vi } from "vitest";
import {
  buildSigningUrl,
  chatLabelFromClientId,
  consumeEnterActionIntent,
  EnterActionIntentConsumeError,
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

  it("forwards strategy to createAgentEnterIntent", async () => {
    const createAgentEnterIntent = vi.fn().mockResolvedValue({
      data: {
        actionId: "abc123",
        expiresAt: "2099-01-01T00:00:00.000Z",
        signingTicket: "ticket-xyz",
      },
    });
    const zyfiApi = {
      createAgentEnterIntent,
    } as unknown as ZyfaiApiService;
    await createEnterActionIntent(zyfiApi, {
      chainId: 8453,
      asset: "USDC",
      amount: "1000000",
      strategy: "aggressive",
    });
    expect(createAgentEnterIntent).toHaveBeenCalledWith({
      chainId: 8453,
      amount: "1000000",
      asset: "USDC",
      strategy: "aggressive",
    });
  });

  it("commits consume after deposit proof", async () => {
    const zyfiApi = {
      consumeAgentEnterIntent: vi.fn().mockResolvedValue({
        data: {
          status: "completed",
          actionId: "abc",
          depositId: "dep-1",
        },
      }),
    } as unknown as ZyfaiApiService;
    const status = await consumeEnterActionIntent(zyfiApi, "abc", {
      chainId: 8453,
      asset: "USDC",
      amount: "1000000",
      txHash: `0x${"a".repeat(64)}`,
      depositId: "dep-1",
    });
    expect(status.status).toBe("completed");
  });

  it("surfaces conflict when intent already completed", async () => {
    const zyfiApi = {
      consumeAgentEnterIntent: vi.fn().mockRejectedValue(
        new Error("Signing intent already completed with a different deposit"),
      ),
    } as unknown as ZyfaiApiService;
    await expect(
      consumeEnterActionIntent(zyfiApi, "abc", {
        chainId: 8453,
        asset: "USDC",
        amount: "1000000",
        txHash: `0x${"a".repeat(64)}`,
        depositId: "dep-1",
      }),
    ).rejects.toMatchObject({ code: "conflict" });
  });

  it("requires deposit proof fields", async () => {
    const zyfiApi = {} as ZyfaiApiService;
    await expect(
      consumeEnterActionIntent(zyfiApi, "abc", {
        chainId: 8453,
        asset: "USDC",
        amount: "1000000",
      }),
    ).rejects.toBeInstanceOf(EnterActionIntentConsumeError);
  });
});
