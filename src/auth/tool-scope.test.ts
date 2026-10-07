import { describe, expect, it } from "vitest";
import {
  authorizeMcpRequestBody,
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
    expect(authorizeMcpToolCall("register_deposit", undefined)).toMatchObject({
      ok: false,
      status: 401,
    });
  });

  it("returns 403 when the session is missing the tool scope", () => {
    expect(
      authorizeMcpToolCall("get_portfolio", { scope: "mcp:tools:write:deposit" }),
    ).toMatchObject({
      ok: false,
      status: 403,
      error: "insufficient_scope",
    });
  });

  it("advertises write scopes only when write tools are enabled", () => {
    expect(protectedResourceScopes(false)).toEqual(["mcp:tools:read"]);
    expect(protectedResourceScopes(true)).toContain("mcp:tools:write:deposit");
    expect(protectedResourceScopes(true)).toContain("mcp:tools:write:withdraw");
    expect(protectedResourceScopes(true)).not.toContain("mcp:tools:write");
  });

  it("requires configure scope for set_strategy", () => {
    expect(
      authorizeMcpToolCall("set_strategy", { scope: "mcp:tools:read" }),
    ).toMatchObject({
      ok: false,
      status: 403,
      error: "insufficient_scope",
      message: "Missing scope mcp:tools:write:configure",
    });
    expect(
      authorizeMcpToolCall("set_strategy", {
        scope: "mcp:tools:read mcp:tools:write:configure",
      }),
    ).toEqual({ ok: true });
  });

  it("allows a session that includes the tool scope", () => {
    expect(
      authorizeMcpToolCall("preview_action", { scope: "mcp:tools:read" }),
    ).toEqual({ ok: true });
    expect(
      authorizeMcpToolCall("register_deposit", {
        scope: "mcp:tools:read mcp:tools:write:deposit",
      }),
    ).toEqual({ ok: true });
  });

  it("treats unlisted tool names as read-scoped (not public)", () => {
    expect(
      authorizeMcpToolCall("hypothetical_unlisted_tool", undefined),
    ).toMatchObject({
      ok: false,
      status: 401,
      error: "unauthorized",
    });
    expect(
      authorizeMcpToolCall("hypothetical_unlisted_tool", {
        scope: "mcp:tools:read",
      }),
    ).toEqual({ ok: true });
    expect(
      authorizeMcpToolCall("hypothetical_unlisted_tool", {
        scope: "mcp:tools:write:deposit",
      }),
    ).toMatchObject({
      ok: false,
      status: 403,
      error: "insufficient_scope",
    });
  });
});

describe("authorizeMcpRequestBody", () => {
  const toolsCall = (name: string) => ({
    jsonrpc: "2.0",
    id: 1,
    method: "tools/call",
    params: { name },
  });

  it("rejects an unauthenticated protected tool in a batch", () => {
    expect(
      authorizeMcpRequestBody(
        [toolsCall("find_opportunities"), toolsCall("get_portfolio")],
        undefined,
      ),
    ).toMatchObject({ ok: false, status: 401 });
  });

  it("rejects insufficient scope for a protected tool in a batch", () => {
    expect(
      authorizeMcpRequestBody([toolsCall("withdraw")], {
        scope: "mcp:tools:read",
      }),
    ).toMatchObject({ ok: false, status: 403 });
  });

  it("allows withdraw with deposit write scope", () => {
    expect(
      authorizeMcpRequestBody([toolsCall("withdraw")], {
        scope: "mcp:tools:read mcp:tools:write:deposit",
      }),
    ).toEqual({ ok: true });
    expect(
      authorizeMcpRequestBody([toolsCall("register_withdraw")], {
        scope: "mcp:tools:read mcp:tools:write:deposit",
      }),
    ).toEqual({ ok: true });
  });

  it("allows a mixed public and protected batch when scoped", () => {
    expect(
      authorizeMcpRequestBody(
        [toolsCall("find_opportunities"), toolsCall("get_account")],
        { scope: "mcp:tools:read" },
      ),
    ).toEqual({ ok: true });
  });

  it("allows a fully scoped protected batch", () => {
    expect(
      authorizeMcpRequestBody(
        [toolsCall("prepare_deposit"), toolsCall("register_deposit")],
        { scope: "mcp:tools:read mcp:tools:write:deposit" },
      ),
    ).toEqual({ ok: true });
  });
});
