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

/** Scope required to call a tool. Undefined means public discovery only (PUBLIC_TOOLS). */
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
    "wait_for_deposit_handover",
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
  if (
    toolName === "register_deposit" ||
    toolName === "prepare_deposit" ||
    toolName === "register_withdraw"
  ) {
    return "mcp:tools:write:deposit";
  }
  if (toolName === "update_settings" || toolName === "set_strategy") {
    return "mcp:tools:write:configure";
  }
  if (toolName === "withdraw") {
    return "mcp:tools:write:deposit";
  }
  return "mcp:tools:read";
}

const WRITE_TOOL_SCOPES = [
  "mcp:tools:write:configure",
  "mcp:tools:write:deposit",
  "mcp:tools:write:withdraw",
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
function isToolsCallRpc(
  value: unknown,
): value is { method?: string; params?: { name?: string } } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    (value as { method?: string }).method === "tools/call"
  );
}

/** Collect tool names from a single JSON-RPC object or batch array. */
export function collectToolsCallNames(body: unknown): string[] {
  if (Array.isArray(body)) {
    return body
      .filter(isToolsCallRpc)
      .map((rpc) => rpc.params?.name ?? "")
      .filter(Boolean);
  }
  if (isToolsCallRpc(body)) {
    const name = body.params?.name;
    return name ? [name] : [];
  }
  return [];
}

/**
 * Authorize every tools/call in a JSON-RPC payload (object or batch).
 * Non-tool requests pass without auth checks.
 */
export function authorizeMcpRequestBody(
  body: unknown,
  auth: { scope: string } | undefined,
): McpToolCallAuth {
  const toolNames = collectToolsCallNames(body);
  for (const toolName of toolNames) {
    const decision = authorizeMcpToolCall(toolName, auth);
    if (!decision.ok) {
      return decision;
    }
  }
  return { ok: true };
}

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
  if (toolName === "withdraw" || toolName === "register_withdraw") {
    if (
      scopes.includes("mcp:tools:write:withdraw") ||
      scopes.includes("mcp:tools:write:deposit")
    ) {
      return { ok: true };
    }
    return {
      ok: false,
      status: 403,
      error: "insufficient_scope",
      message: "Missing scope mcp:tools:write:deposit",
    };
  }
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
