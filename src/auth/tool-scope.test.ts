import { describe, expect, it } from "vitest";
import {
  authorizeMcpToolCall,
  protectedResourceScopes,
} from "./tool-scope.js";

describe("authorizeMcpToolCall", () => {
  it("allows public discovery tools without a session", () => {
    expect(authorizeMcpToolCall("find_opportunities", undefined)).toEqual({
      ok: true,
    });
    expect(authorizeMcpToolCall("compare_opportunities", undefined)).toEqual({
      ok: true,
    });
    expect(authorizeMcpToolCall("get-available-protocols", undefined)).toEqual({
      ok: true,
    });
  });

  it("returns 401 for protected tools without a session", () => {
    expect(authorizeMcpToolCall("get_account", undefined)).toMatchObject({
      ok: false,
      status: 401,
      error: "unauthorized",
    });
    expect(authorizeMcpToolCall("enter_position", undefined)).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("returns 403 when the session is missing the tool scope", () => {
    expect(
      authorizeMcpToolCall("get_portfolio", { scope: "mcp:tools:write" }),
    ).toMatchObject({
      ok: false,
      status: 403,
      error: "insufficient_scope",
    });
  });

  it("advertises write scopes only when write tools are enabled", () => {
    expect(protectedResourceScopes(false)).toEqual(["mcp:tools:read"]);
    expect(protectedResourceScopes(true)).toContain("mcp:tools:write:deposit");
  });

  it("allows a session that includes the tool scope", () => {
    expect(
      authorizeMcpToolCall("preview_action", { scope: "mcp:tools:read" }),
    ).toEqual({ ok: true });
    expect(
      authorizeMcpToolCall("enter_position", {
        scope: "mcp:tools:read mcp:tools:write:deposit",
      }),
    ).toEqual({ ok: true });
  });
});
