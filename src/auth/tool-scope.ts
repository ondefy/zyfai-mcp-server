/**
 * Public discovery tools. Callable with no session.
 * Every other registered tool requires a user and a scope.
 */
const PUBLIC_TOOLS = new Set([
  "find_opportunities",
  "compare_opportunities",
  "get-available-protocols",
]);

export type McpToolCallAuth =
  | { ok: true }
  | {
      ok: false;
      status: 401 | 403;
      error: "unauthorized" | "insufficient_scope";
      message: string;
    };

/** Scope required to call a tool. Undefined means the tool is public. */
export function requiredScopeForTool(toolName: string): string | undefined {
  if (PUBLIC_TOOLS.has(toolName)) {
    return undefined;
  }
  const readTools = new Set([
    "get_account",
    "get_portfolio",
    "get_positions",
    "preview_action",
    "get_settings",
    "get_deposit_status",
    "get_earnings",
    "get_daily_earnings",
    "get_apy_history",
    "get_history",
    "get_first_deposit",
    "get_rebalance_frequency",
  ]);
  if (readTools.has(toolName)) {
    return "mcp:tools:read";
  }
  if (toolName === "register_deposit" || toolName === "prepare_deposit") {
    return "mcp:tools:write:deposit";
  }
  if (toolName === "update_settings") {
    return "mcp:tools:write:configure";
  }
  return undefined;
}

const WRITE_TOOL_SCOPES = [
  "mcp:tools:write:configure",
  "mcp:tools:write:deposit",
] as const;

/**
 * Scopes this process's registered tools actually require.
 * Read tools are always registered. Write scopes are advertised only when
 * write tools are registered (`MCP_WRITE_TOOLS_ENABLED`).
 */
export function protectedResourceScopes(writeToolsEnabled: boolean): string[] {
  if (!writeToolsEnabled) {
    return ["mcp:tools:read"];
  }
  return ["mcp:tools:read", ...WRITE_TOOL_SCOPES];
}

export function insufficientScopeWwwAuthenticate(): string {
  return 'Bearer error="insufficient_scope", error_description="Missing OAuth scope for this tool"';
}

/**
 * Authorize one tools/call.
 * Public tools pass with no session. Protected tools without a session are 401
 * so the host can start OAuth. A present session must include the tool scope.
 */
export function authorizeMcpToolCall(
  toolName: string,
  auth: { scope: string } | undefined,
): McpToolCallAuth {
  const required = requiredScopeForTool(toolName);
  if (!required) {
    return { ok: true };
  }
  if (!auth) {
    return {
      ok: false,
      status: 401,
      error: "unauthorized",
      message: "Authentication required for this tool",
    };
  }
  const scopes = auth.scope.split(/\s+/).filter(Boolean);
  if (!scopes.includes(required)) {
    return {
      ok: false,
      status: 403,
      error: "insufficient_scope",
      message: `Missing scope ${required}`,
    };
  }
  return { ok: true };
}
