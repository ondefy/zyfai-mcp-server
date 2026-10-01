import { describe, expect, it } from "vitest";
import { authorizeMcpToolCall } from "../auth/tool-scope.js";
import { depositIntentRegistrationMismatch } from "../services/deposit-intent.js";

describe("agent deposit MCP flow (deterministic)", () => {
  it("requires withdraw scope", () => {
    expect(
      authorizeMcpToolCall("withdraw", { scope: "mcp:tools:read" }),
    ).toMatchObject({ ok: false, status: 403 });
    expect(
      authorizeMcpToolCall("withdraw", {
        scope: "mcp:tools:read mcp:tools:write:withdraw",
      }),
    ).toEqual({ ok: true });
  });

  it("blocks register_deposit when intent fields disagree", () => {
    expect(
      depositIntentRegistrationMismatch(
        {
          status: "pending",
          chainId: 8453,
          asset: "USDC",
          amount: "1000000",
        },
        8453,
        "USDC",
        "2000000",
      ),
    ).toBe("Deposit intent amount does not match");
    expect(
      depositIntentRegistrationMismatch(
        {
          status: "expired",
          chainId: 8453,
          asset: "USDC",
          amount: "1000000",
        },
        8453,
        "USDC",
        "1000000",
      ),
    ).toBe("Deposit intent expired");
    expect(
      depositIntentRegistrationMismatch(
        {
          status: "pending",
          chainId: 8453,
          asset: "USDC",
          amount: "1000000",
        },
        8453,
        "USDC",
        "1000000",
      ),
    ).toBeNull();
  });
});
