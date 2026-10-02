import jwt from "jsonwebtoken";
import { describe, expect, it, vi } from "vitest";

vi.mock("../config/env.js", () => ({
  config: {
    mcpOAuthJwtSecret: "test-mcp-secret",
    mcpResourceUrl: "https://mcp.zyf.ai",
  },
}));

import { verifyMcpAccessToken } from "./mcp-token.js";

describe("verifyMcpAccessToken", () => {
  it("rejects legacy tokens that embed zyfai_access_token", () => {
    const token = jwt.sign(
      {
        sub: "user-1",
        eoa: "0x0000000000000000000000000000000000000001",
        scope: "mcp:tools:read",
        zyfai_access_token: "legacy-user-jwt",
        aud: "https://mcp.zyf.ai",
      },
      "test-mcp-secret",
    );

    expect(() => verifyMcpAccessToken(token)).toThrow(/Invalid MCP token claims/);
  });

  it("accepts opaque session tokens with sid", () => {
    const token = jwt.sign(
      {
        sub: "user-1",
        eoa: "0x0000000000000000000000000000000000000001",
        scope: "mcp:tools:read",
        sid: "session-abc",
        aud: "https://mcp.zyf.ai",
      },
      "test-mcp-secret",
    );

    const payload = verifyMcpAccessToken(token);
    expect(payload.sid).toBe("session-abc");
  });
});
