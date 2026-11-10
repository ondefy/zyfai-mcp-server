import { describe, expect, it } from "vitest";
import { onlyLiveOpportunities } from "./live-opportunities.js";

describe("onlyLiveOpportunities", () => {
  it("drops pools that are not live from the SDK payload", () => {
    const filtered = onlyLiveOpportunities({
      success: true,
      data: [
        { poolName: "USDC", status: "live" },
        { poolName: "Varlamore", status: "not_live" },
        { poolName: "Silo", status: "dead" },
      ],
    }) as { data: { poolName: string }[] };

    expect(filtered.data.map((row) => row.poolName)).toEqual(["USDC"]);
  });
});