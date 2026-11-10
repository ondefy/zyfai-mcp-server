import { describe, expect, it } from "vitest";
import {
  resumeOpportunityRebalanceSchema,
  setManualAllocationSchema,
} from "./agent-write.tools.js";

describe("manual allocation tool schemas", () => {
  it("does not take a user address or an amount", () => {
    expect(setManualAllocationSchema).not.toHaveProperty("userAddress");
    expect(setManualAllocationSchema).not.toHaveProperty("amount");
    expect(setManualAllocationSchema).not.toHaveProperty("receiver");
    expect(resumeOpportunityRebalanceSchema).not.toHaveProperty("userAddress");
    expect(Object.keys(resumeOpportunityRebalanceSchema)).toEqual([
      "assetType",
    ]);
  });
});
