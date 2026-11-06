import { describe, expect, it } from "vitest";
import {
  humanAmountToLeastUnits,
  speakAccount,
  speakCompare,
  speakPortfolio,
  speakSimulation,
  strategyFromSettings,
} from "./plain-reply.js";

describe("speakSimulation", () => {
  it("names only the pool the simulation chose", () => {
    const response = {
      data: {
        "8453": [
          {
            protocol: "Morpho",
            pool: "USDC/SOL",
            simulated_apy: 6.72,
            amount: 10,
          },
        ],
      },
      excluded: {
        "8453": [{ pool: "Clearstar cbAssets", reason: "tvl_unstable" }],
      },
    };
    const reply = speakSimulation(response, 10, "USDC");

    expect(reply).toBe("10 USDC on Base would go to USDC/SOL at 6.72%.");
    expect(reply).not.toContain("Clearstar");
    expect(reply).not.toContain("tvl");
  });

  it("asks for nothing when no pool is chosen", () => {
    expect(speakSimulation({ data: { "8453": [] } }, 10, "USDC")).toBe(
      "Nothing is available for that amount right now.",
    );
  });
});

describe("speakCompare", () => {
  it("states both strategies in two sentences", () => {
    const reply = speakCompare(
      "10 USDC on Base would go to USDC/SOL at 6.72%.",
      "10 USDC on Base would go to Compound V3 USDC at 5.1%.",
    );
    expect(reply).toBe(
      "Conservative: 10 USDC on Base would go to USDC/SOL at 6.72%. Aggressive: 10 USDC on Base would go to Compound V3 USDC at 5.1%.",
    );
  });
});

describe("humanAmountToLeastUnits", () => {
  it("converts 10 USDC to 10000000", () => {
    expect(humanAmountToLeastUnits("10", "USDC")).toBe("10000000");
    expect(humanAmountToLeastUnits("10.5", "USDC")).toBe("10500000");
  });

  it("converts 1 WETH to 18 decimals", () => {
    expect(humanAmountToLeastUnits("1", "WETH")).toBe("1000000000000000000");
  });
});

describe("speakPortfolio", () => {
  it("names the position and the idle amount without session fields", () => {
    const source = {
      hasActiveSessionKey: true,
      sessionKey: "0xabc",
      positions: [
        {
          protocol_name: "Morpho",
          pool: "USDC/SOL",
          token_symbol: "USDC",
          decimals: 6,
          underlyingAmount: "10000000",
          pool_apy: 6.72,
        },
      ],
      staleBalances: [
        { chainId: 8453, tokenSymbol: "USDC", balance: "0x1e8480" },
      ],
    };
    const reply = speakPortfolio(source);
    expect(reply).toContain("10 USDC are in USDC/SOL at 6.72%");
    expect(reply).toContain("2 USDC are idle on Base");
    expect(reply).not.toContain("sessionKey");
    expect(reply).not.toContain("0xabc");
    expect(reply).not.toContain("hasActiveSessionKey");
  });
});

describe("speakAccount", () => {
  it("names chains and skips session fields", () => {
    const reply = speakAccount({ chains: [8453] });
    expect(reply).toBe("You can deposit on Base.");
    expect(reply).not.toContain("sessionKey");
  });
});

describe("strategyFromSettings", () => {
  it("reads the saved USDC strategy", () => {
    expect(
      strategyFromSettings({
        assetTypeSettings: { USDC: { rebalanceStrategy: "degen" } },
      }),
    ).toBe("aggressive");
    expect(strategyFromSettings({})).toBeUndefined();
  });
});
