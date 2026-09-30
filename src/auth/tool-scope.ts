/** Maps public tool names to required OAuth scopes (when MCP_AUTH_REQUIRED). */
export function requiredScopeForTool(toolName: string): string | undefined {
  const readTools = new Set([
    "get_account",
    "get_portfolio",
    "get_positions",
    "find_opportunities",
    "compare_opportunities",
    "preview_action",
    "get_agent_permissions",
    "get_action_status",
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
  if (toolName === "enter_position" || toolName === "prepare_enter_position") {
    return "mcp:tools:write:deposit";
  }
  if (toolName === "exit_position") {
    return "mcp:tools:write";
  }
  if (toolName === "customize_position") {
    return "mcp:tools:write:configure";
  }
  if (toolName === "get-available-protocols") {
    return undefined;
  }
  return undefined;
}

export function insufficientScopeWwwAuthenticate(): string {
  return 'Bearer error="insufficient_scope", error_description="Missing OAuth scope for this tool"';
}
