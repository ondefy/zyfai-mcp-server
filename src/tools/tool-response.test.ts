import { describe, expect, it } from "vitest";
import { toolJsonContent } from "./tool-response.js";

describe("toolJsonContent", () => {
  it("includes JSON when a summary headline is provided", () => {
    const result = toolJsonContent(
      { signingUrl: "https://zyf.ai/agent/deposit-sign?ticket=abc" },
      "Deposit preparation",
    );
    expect(result.content[0]?.text).toContain("Deposit preparation");
    expect(result.content[0]?.text).toContain("signingUrl");
    expect(result.content[0]?.text).toContain("ticket=abc");
  });

  it("wraps array payloads in structuredContent.items", () => {
    const result = toolJsonContent([{ asset: "USDC" }], "Zyfai settings");
    expect(result.structuredContent).toEqual({
      items: [{ asset: "USDC" }],
    });
  });
});
