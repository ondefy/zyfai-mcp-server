import { describe, expect, it, vi } from "vitest";
import { runPrepareDeposit } from "./prepare-deposit.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

describe("runPrepareDeposit", () => {
  const baseParams = {
    userAddress: "0x5006793977cC87D267a175d14b47B9D7a48513EF",
    chainId: 8453 as const,
    amount: "1000000",
    asset: "USDC" as const,
  };

  it("prepares transfer calldata and creates a deposit intent", async () => {
    const callOrder: string[] = [];
    const prepareDeposit = vi.fn().mockImplementation(async () => {
      callOrder.push("prepareDeposit");
      return {
        phase: "prepare_transfer",
        setup: { applied: false },
        transfer: {},
      };
    });
    const createAgentDepositIntent = vi.fn().mockImplementation(async () => {
      callOrder.push("createAgentDepositIntent");
      return {
        data: {
          actionId: "act-1",
          signingTicket: "ticket-1",
        },
      };
    });
    const zyfiApi = {
      prepareDeposit,
      createAgentDepositIntent,
    } as unknown as ZyfaiApiService;

    const result = await runPrepareDeposit(zyfiApi, baseParams);

    expect(callOrder).toEqual(["prepareDeposit", "createAgentDepositIntent"]);
    expect(prepareDeposit).toHaveBeenCalledWith(baseParams);
    expect(createAgentDepositIntent).toHaveBeenCalledWith({
      chainId: 8453,
      amount: "1000000",
      asset: "USDC",
    });
    expect(result.actionId).toBe("act-1");
  });
});
