import { AsyncLocalStorage } from "node:async_hooks";

export type McpRequestAuth = {
  userId: string;
  eoa: string;
  scope: string;
  sessionId: string;
  mcpAccessToken: string;
};

const storage = new AsyncLocalStorage<McpRequestAuth>();

export function runWithMcpAuth<T>(auth: McpRequestAuth, fn: () => T): T {
  return storage.run(auth, fn);
}

export function getMcpAuth(): McpRequestAuth | undefined {
  return storage.getStore();
}

export function requireMcpAuth(): McpRequestAuth {
  const auth = getMcpAuth();
  if (!auth) {
    throw new Error("MCP authentication required");
  }
  return auth;
}

export function assertEoaMatches(userAddress: string): void {
  const auth = requireMcpAuth();
  if (auth.eoa.toLowerCase() !== userAddress.toLowerCase()) {
    throw new Error(
      "userAddress does not match the authenticated wallet for this session",
    );
  }
}

export function scopeIncludes(required: string): boolean {
  const auth = requireMcpAuth();
  const scopes = auth.scope.split(/\s+/).filter(Boolean);
  return scopes.includes(required) || scopes.includes("mcp:tools:write");
}
