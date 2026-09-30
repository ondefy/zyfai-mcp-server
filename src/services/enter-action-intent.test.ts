import { describe, expect, it } from "vitest";
import {
  consumeEnterActionIntent,
  createEnterActionIntent,
} from "./enter-action-intent.js";

describe("enter-action-intent", () => {
  it("binds enter_position to preview intent", () => {
    const actionId = createEnterActionIntent({
      userId: "user-1",
      clientId: "client-a",
      chainId: 8453,
      asset: "USDC",
      amount: "1000000",
    });
    const consumed = consumeEnterActionIntent(actionId, {
      userId: "user-1",
      clientId: "client-a",
      chainId: 8453,
      asset: "USDC",
      amount: "1000000",
    });
    expect(consumed?.asset).toBe("USDC");
    expect(
      consumeEnterActionIntent(actionId, {
        userId: "user-1",
        clientId: "client-a",
        chainId: 8453,
        asset: "USDC",
        amount: "1000000",
      }),
    ).toBeNull();
  });
});
