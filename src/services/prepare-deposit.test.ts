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

  it("does not call setAssetStrategy when strategy is omitted", async () => {
    const setAssetStrategy = vi.fn();
    const prepareEnterPosition = vi.fn().mockResolvedValue({
      phase: "prepare_transfer",
      setup: { applied: false },
      transfer: {},
    });
    const zyfiApi = {
      setAssetStrategy,
      prepareEnterPosition,
      createAgentEnterIntent: vi.fn().mockResolvedValue({
        data: {
          actionId: "act-1",
          signingTicket: "ticket-1",
        },
      }),
    } as unknown as ZyfaiApiService;

    await runPrepareDeposit(zyfiApi, baseParams);

    expect(setAssetStrategy).not.toHaveBeenCalled();
    expect(prepareEnterPosition).toHaveBeenCalledWith({
      ...baseParams,
      strategy: undefined,
    });
  });

  it("applies strategy before prepare and intent when provided", async () => {
    const callOrder: string[] = [];
    const setAssetStrategy = vi.fn().mockImplementation(async () => {
      callOrder.push("setAssetStrategy");
    });
    const prepareEnterPosition = vi.fn().mockImplementation(async () => {
      callOrder.push("prepareEnterPosition");
      return {
        phase: "prepare_transfer",
        setup: { applied: false },
        transfer: {},
      };
    });
    const createAgentEnterIntent = vi.fn().mockImplementation(async () => {
      callOrder.push("createAgentEnterIntent");
      return {
        data: {
          actionId: "act-2",
          signingTicket: "ticket-2",
        },
      };
    });
    const zyfiApi = {
      setAssetStrategy,
      prepareEnterPosition,
      createAgentEnterIntent,
    } as unknown as ZyfaiApiService;

    const result = await runPrepareDeposit(zyfiApi, {
      ...baseParams,
      strategy: "aggressive",
    });

    expect(callOrder).toEqual([
      "setAssetStrategy",
      "prepareEnterPosition",
      "createAgentEnterIntent",
    ]);
    expect(setAssetStrategy).toHaveBeenCalledWith({
      asset: "USDC",
      strategy: "aggressive",
      chains: [8453],
    });
    expect(prepareEnterPosition).toHaveBeenCalledWith({
      ...baseParams,
      strategy: "aggressive",
    });
    expect(createAgentEnterIntent).toHaveBeenCalledWith({
      chainId: 8453,
      amount: "1000000",
      asset: "USDC",
      strategy: "aggressive",
    });
    expect(result.strategy).toBe("aggressive");
    expect(result.actionId).toBe("act-2");
  });
});
