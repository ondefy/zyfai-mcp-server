import { describe, expect, it, vi } from "vitest";
import { waitForDepositHandover } from "./wait-for-deposit-handover.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

describe("waitForDepositHandover", () => {
  it("delegates to the SDK handover waiter", async () => {
    const waitForAgentDepositHandover = vi.fn().mockResolvedValue({
      intent: { status: "completed", depositId: "dep-1" },
      credited: { status: "credited", balanceCredited: true },
    });
    const zyfiApi = { waitForAgentDepositHandover } as unknown as ZyfaiApiService;

    const result = await waitForDepositHandover(zyfiApi, {
      actionId: "act-1",
      chainId: 8453,
    });

    expect(waitForAgentDepositHandover).toHaveBeenCalledWith("act-1", 8453, {
      waitForCredit: true,
      timeoutMs: undefined,
    });
    expect(result.credited?.status).toBe("credited");
  });
});
