import { describe, expect, it, vi } from "vitest";
import type { ZyfaiSDK } from "@zyfai/sdk";
import { ZyfaiApiService } from "./zyfai-api.service.js";

describe("ZyfaiApiService lifecycle passthroughs", () => {
  it("waitForDepositPosition delegates to the authenticated SDK", async () => {
    const waitForDepositPosition = vi.fn().mockResolvedValue({ status: "positioned" });
    const service = new ZyfaiApiService();
    vi.spyOn(service, "getAuthenticatedSDK").mockResolvedValue({
      waitForDepositPosition,
    } as unknown as ZyfaiSDK);

    await service.waitForDepositPosition("dep-1", 8453, { timeoutMs: 5000 });

    expect(waitForDepositPosition).toHaveBeenCalledWith("dep-1", 8453, {
      timeoutMs: 5000,
    });
  });

  it("getWithdrawStatus delegates to the authenticated SDK", async () => {
    const getWithdrawStatus = vi.fn().mockResolvedValue({ status: "accepted" });
    const service = new ZyfaiApiService();
    vi.spyOn(service, "getAuthenticatedSDK").mockResolvedValue({
      getWithdrawStatus,
    } as unknown as ZyfaiSDK);

    await service.getWithdrawStatus("wd-1");

    expect(getWithdrawStatus).toHaveBeenCalledWith("wd-1");
  });

  it("waitForWithdrawSettlement delegates to the authenticated SDK", async () => {
    const waitForWithdrawSettlement = vi
      .fn()
      .mockResolvedValue({ status: "async_cooldown" });
    const service = new ZyfaiApiService();
    vi.spyOn(service, "getAuthenticatedSDK").mockResolvedValue({
      waitForWithdrawSettlement,
    } as unknown as ZyfaiSDK);

    await service.waitForWithdrawSettlement("wd-1", 42161, { intervalMs: 250 });

    expect(waitForWithdrawSettlement).toHaveBeenCalledWith("wd-1", 42161, {
      intervalMs: 250,
    });
  });

  it("waitForWithdrawComplete delegates to the authenticated SDK", async () => {
    const waitForWithdrawComplete = vi
      .fn()
      .mockResolvedValue({ status: "completed" });
    const service = new ZyfaiApiService();
    vi.spyOn(service, "getAuthenticatedSDK").mockResolvedValue({
      waitForWithdrawComplete,
    } as unknown as ZyfaiSDK);

    await service.waitForWithdrawComplete("wd-1", 1, {
      cooldownIntervalMs: 10_000,
    });

    expect(waitForWithdrawComplete).toHaveBeenCalledWith("wd-1", 1, {
      cooldownIntervalMs: 10_000,
    });
  });
});
