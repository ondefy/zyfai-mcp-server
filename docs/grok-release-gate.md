# Grok / write MCP release gate

Run after deploying **zyfai-api** (enter intents + signing tickets), **zyf.ai** (`/agent/deposit-sign`), and a **write** MCP instance (`MCP_WRITE_TOOLS_ENABLED=true`, unique `MCP_RESOURCE_URL`).

## Preconditions

- User has a zyf.ai account with a funded EOA (USDC on Base for the demo script).
- Write MCP HTTPS URL is reachable from the public internet (not localhost).
- `ZYFAI_WEB_SIGNING_BASE` on the write MCP points at the zyf.ai origin users can open (default `https://zyf.ai`).

## Checklist

1. **Read URL unchanged:** `https://mcp.zyf.ai/mcp` `tools/list` has no `prepare_deposit`, `register_deposit`, or `update_settings`.
2. **Write URL metadata:** `GET {writeOrigin}/.well-known/oauth-protected-resource` lists `mcp:tools:write:deposit` and `mcp:tools:write:configure` when writes are enabled (not `mcp:tools:write` unless a withdraw tool is registered).
3. **Grok connect:** Custom connector → paste write `/mcp` URL → complete OAuth.
4. **Read path:** `get_account`, `find_opportunities` (Base, conservative USDC).
5. **Preview:** `preview_action` returns simulation only (no `actionId`).
6. **Prepare:** `prepare_deposit` returns transfer calldata, `actionId`, and **`signingUrl`**.
7. **Sign outside Grok:** Open `signingUrl` in the system browser (not inside the chat webview). Complete wallet connect + transfer on zyf.ai.
8. **Poll:** `get_deposit_status` with `actionId` until `status` is `completed` and `depositId` is set.
9. **Verify:** `get_positions` shows the new position; `get_deposit_status` with `depositId` if you need handover/credit detail.
10. **Idempotency:** Re-opening a consumed intent or re-completing with a different tx must fail; funds must not double-credit.

**Fallback gate (Cursor / dev):** steps 7–8 can be replaced by broadcasting the transfer manually and calling `register_deposit` with `actionId` + `txHash`.

Record OAuth friction (missing scopes, broken redirect, CIMD) in the PR or ops runbook if step 3 fails.
