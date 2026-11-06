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

  it("speaks only the reply when one is set", () => {
    const url = "https://zyf.ai/agent/deposit-sign?ticket=abc";
    const result = toolJsonContent(
      {
        sessionKey: "secret",
        excluded: [{ pool: "Clearstar" }],
        signingUrl: url,
      },
      "Deposit preparation",
      `10 USDC on Base. [Sign the deposit](${url})`,
    );
    const text = result.content[0]?.text ?? "";
    expect(text).toBe(`10 USDC on Base. [Sign the deposit](${url})`);
    expect(text).not.toContain("sessionKey");
    expect(text).not.toContain("excluded");
    expect(text).not.toContain("signingUrl");
    expect(text).toContain("ticket=abc");
  });
});
