# Grok / write MCP release gate

Run after deploying **zyfai-api** (PR 599) and a **write** MCP instance (`MCP_WRITE_TOOLS_ENABLED=true`, unique `MCP_RESOURCE_URL`).

## Preconditions

- User has a zyf.ai account with a funded EOA (USDC on Base for the demo script).
- User created an agent mandate on zyf.ai → Transparency → **Agent access** for the OAuth client that Grok registers.
- Write MCP HTTPS URL is reachable from the public internet (not localhost).

## Checklist

1. **Read URL unchanged:** `https://mcp.zyf.ai/mcp` `tools/list` has no `enter_position`, `prepare_enter_position`, `exit_position`, or `customize_position`.
2. **Write URL metadata:** `GET {writeOrigin}/.well-known/oauth-protected-resource` lists `mcp:tools:write:deposit` (and other write scopes) when writes are enabled.
3. **Grok connect:** Custom connector → paste write `/mcp` URL → complete OAuth.
4. **Read path:** `get_account`, `find_opportunities` (Base, conservative USDC).
5. **Preview:** `preview_action` returns simulation only (no `actionId`).
6. **Prepare:** `prepare_enter_position` returns transfer calldata + `actionId`.
7. **Sign outside Grok:** Broadcast ERC-20 transfer to the Safe using the returned calldata.
8. **Enter:** `enter_position` with `actionId`, `txHash`, least-unit `amount` → deposit registers.
9. **Verify:** `get_positions` shows the new position; `get_action_status` if needed.
10. **Idempotency:** Repeat `enter_position` with the same `actionId` → must fail; funds must not double-credit.

Record OAuth friction (missing scopes, broken redirect, CIMD) in the PR or ops runbook if step 3 fails.
