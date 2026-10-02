import { describe, expect, it, vi } from "vitest";
import { runWithMcpAuth } from "./request-context.js";
import { resolveSessionSmartWallet } from "./user-scope.js";
import type { ZyfaiApiService } from "../services/zyfai-api.service.js";

describe("resolveSessionSmartWallet", () => {
  it("throws when MCP auth is not in context", async () => {
    const zyfiApi = {
      getUserDetails: vi.fn(),
    } as unknown as ZyfaiApiService;

    await expect(resolveSessionSmartWallet(zyfiApi)).rejects.toThrow(
      "MCP authentication required",
    );
    expect(zyfiApi.getUserDetails).not.toHaveBeenCalled();
  });

  it("throws when user has no smart wallet yet", async () => {
    const zyfiApi = {
      getUserDetails: vi.fn().mockResolvedValue({ smartWallet: undefined }),
    } as unknown as ZyfaiApiService;

    await expect(
      runWithMcpAuth(
        {
          userId: "u1",
          eoa: "0xabc",
          scope: "mcp:tools:read",
          sessionId: "s1",
          clientId: "c1",
          mcpAccessToken: "token",
        },
        () => resolveSessionSmartWallet(zyfiApi),
      ),
    ).rejects.toThrow("No smart wallet assigned");
  });

  it("returns smart wallet from getUserDetails", async () => {
    const zyfiApi = {
      getUserDetails: vi.fn().mockResolvedValue({
        smartWallet: "0xSmart",
      }),
    } as unknown as ZyfaiApiService;

    const wallet = await runWithMcpAuth(
      {
        userId: "u1",
        eoa: "0xabc",
        scope: "mcp:tools:read",
        sessionId: "s1",
        clientId: "c1",
        mcpAccessToken: "token",
      },
      () => resolveSessionSmartWallet(zyfiApi),
    );

    expect(wallet).toBe("0xSmart");
    expect(zyfiApi.getUserDetails).toHaveBeenCalledWith("USDC");
  });
});
