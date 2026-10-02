import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../config/env.js", () => ({
  config: {
    mcpAuthRequired: false,
    mcpResourceUrl: "https://mcp.zyf.ai",
  },
}));

vi.mock("../auth/mcp-token.js", () => ({
  verifyMcpAccessToken: vi.fn(),
}));

import { verifyMcpAccessToken } from "../auth/mcp-token.js";
import { config } from "../config/env.js";
import { mcpAuthMiddleware, type RequestWithMcpAuth } from "./mcp-auth.middleware.js";

const verify = vi.mocked(verifyMcpAccessToken);
const mutableConfig = config as { mcpAuthRequired: boolean };

function invoke(authorization?: string) {
  const headers: Record<string, string> = {};
  const state: {
    status?: number;
    body?: unknown;
    authenticate?: string;
  } = {};
  const req = { headers: authorization ? { authorization } : {} } as Request;
  const res = {
    setHeader(name: string, value: string) {
      if (name === "WWW-Authenticate") {
        state.authenticate = value;
      }
      headers[name] = value;
      return this;
    },
    status(code: number) {
      state.status = code;
      return this;
    },
    json(body: unknown) {
      state.body = body;
      return this;
    },
  } as unknown as Response;
  const next = vi.fn() as NextFunction;
  mcpAuthMiddleware(req, res, next);
  return { req: req as RequestWithMcpAuth, next, state };
}

describe("mcpAuthMiddleware", () => {
  beforeEach(() => {
    mutableConfig.mcpAuthRequired = false;
    verify.mockReset();
  });

  it("leaves an optional request anonymous when no bearer is sent", () => {
    const { next, state, req } = invoke();
    expect(next).toHaveBeenCalledOnce();
    expect(state.status).toBeUndefined();
    expect(req.mcpAuth).toBeUndefined();
  });

  it("attaches a valid bearer when auth is optional", () => {
    verify.mockReturnValue({
      sub: "user-1",
      eoa: "0xabc",
      scope: "mcp:tools:read",
      sid: "session-1",
      client_id: "client-1",
    });
    const { next, req } = invoke("Bearer good-token");
    expect(verify).toHaveBeenCalledWith("good-token");
    expect(next).toHaveBeenCalledOnce();
    expect(req.mcpAuth).toMatchObject({
      userId: "user-1",
      eoa: "0xabc",
      clientId: "client-1",
      mcpAccessToken: "good-token",
    });
  });

  it("rejects an invalid bearer even when auth is optional", () => {
    verify.mockImplementation(() => {
      throw new Error("Invalid MCP token claims");
    });
    const { next, state } = invoke("Bearer bad-token");
    expect(next).not.toHaveBeenCalled();
    expect(state.status).toBe(401);
    expect(state.body).toMatchObject({ error: "unauthorized" });
    expect(state.authenticate).toContain("resource_metadata=");
  });

  it("rejects a missing bearer when auth is required", () => {
    mutableConfig.mcpAuthRequired = true;
    const { next, state } = invoke();
    expect(next).not.toHaveBeenCalled();
    expect(state.status).toBe(401);
  });

  it("accepts a valid bearer when auth is required", () => {
    mutableConfig.mcpAuthRequired = true;
    verify.mockReturnValue({
      sub: "user-1",
      eoa: "0xabc",
      scope: "mcp:tools:read",
      sid: "session-1",
    });
    const { next, req } = invoke("Bearer good-token");
    expect(next).toHaveBeenCalledOnce();
    expect(req.mcpAuth?.clientId).toBe("unknown-client");
  });
});
