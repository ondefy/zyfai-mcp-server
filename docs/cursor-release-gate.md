# Cursor MCP release gate

Manual QA for MCP releases uses **Cursor** and the workspace MCP entries in [`.cursor/mcp.json`](../../.cursor/mcp.json) (paths relative to `zyfai-workspace` root). This doc is the release gate for [zyfai-mcp-server](https://github.com/ondefy/zyfai-mcp-server).

Run the Cursor checklists below only after **zyfai-api** (enter intents + signing tickets + **v2** deposit/withdraw lifecycle routes), **zyf.ai** (`/agent/deposit-sign`), and the MCP host are on `@zyfai/sdk` **0.10.0+** with lifecycle read tools.

## Deploy (production MCP host)

On the MCP server (`mcp.zyf.ai`), from an SSH session with permission to run `pnpm` and `pm2` in `/apps/zyfai-mcp-server`:

```bash
cd /apps/zyfai-mcp-server && sudo -u deploy git pull origin main && pnpm install --frozen-lockfile && pnpm run build && PM2_HOME=/home/deploy/.pm2 pm2 restart zyfai-mcp-server --update-env && pm2 logs zyfai-mcp-server --lines 50 --nostream
```

- `git pull` runs as `deploy` (that user owns the GitHub deploy key).
- `PM2_HOME=/home/deploy/.pm2` targets the deploy user's PM2 daemon; the app name is `zyfai-mcp-server`.
- Nginx for `mcp.zyf.ai` is unchanged by this step.

For a guarded release (dirty-tree check, `.env` applied on restart, health poll, `pm2 save`), use `pnpm run release` on the same host ([`scripts/release.sh`](../scripts/release.sh)).

## Cursor endpoints

| Cursor key | URL | Use |
| --- | --- | --- |
| `zyfai-mcp-server.prod` | `https://mcp.zyf.ai/mcp` | Post-deploy smoke against production stack (OAuth required for personal tools) |
| `zyfai-mcp-server.local` | `http://127.0.0.1:3005/mcp` | Pre-merge / write-path smoke (`pnpm dev:zyfai-mcp` from workspace root) |

Reload MCP servers in Cursor after changing `mcp.json` or env on the local process.

## Automated smoke (CI / terminal, no Cursor UI)

These do not replace OAuth checks but prove API + MCP wiring before you click through Cursor.

| Check | Command | Proves |
| --- | --- | --- |
| Lifecycle APIs (staging funds) | In `zyfai-sdk/`: `ZYFAI_ENV=staging npm run test:integration -- deposit-withdraw-lifecycle` | v2 deposit position + withdraw settlement/complete on Base |
| MCP + prod APIs (readonly) | In `zyfai-mcp-server/`: `ZYFAI_ENV=production pnpm run test:integration` | In-process MCP → `https://api.zyf.ai` partner reads |
| MCP unit | In `zyfai-mcp-server/`: `pnpm run check` | Types, build, scopes |

Production **fund** smokes stay on staging (`deposit-withdraw-lifecycle` skips on `ZYFAI_ENV=production`).

## Cursor checklist (prod read)

1. **Connect:** Cursor Settings → MCP → ensure `zyfai-mcp-server.prod` is enabled. Open a **new** Agent chat.
2. **OAuth:** Ask the agent to call a protected read (e.g. `get_portfolio`). Complete Zyfai sign-in when Cursor shows the OAuth card (same flow as `mcp_auth` in the MCP panel).
3. **Public read:** In chat: *"Using Zyfai, find conservative USDC opportunities on Base."* Expect `find_opportunities` with live pools (no tool error).
4. **Authenticated read:** *"Show my Zyfai portfolio."* Expect `get_portfolio` or `get_positions` with your data (empty portfolio is valid).
5. **Lifecycle tools present:** Ask the agent to run `tools/list` or inspect the MCP tool list in Cursor. After SDK 0.10 deploy, expect `wait_for_deposit_position`, `get_withdraw_status`, `wait_for_withdraw_settlement`, and `wait_for_withdraw_complete` alongside existing deposit handover tools.
6. **Prod write boundary:** On the public read host, `tools/list` must **not** expose `prepare_deposit`, `register_deposit`, or `update_settings` unless that deployment is intentionally a write instance.

Golden prompts: [`golden-prompts.md`](golden-prompts.md).

## Cursor checklist (local write + lifecycle)

Use when validating [PR](https://github.com/ondefy/zyfai-mcp-server/pull/22)-style lifecycle changes before prod MCP deploy.

1. From workspace root: `cp zyfai-mcp-server/.env.example zyfai-mcp-server/.env` (partner key + OAuth secrets aligned with local `zyfai-api`).
2. Set `MCP_WRITE_TOOLS_ENABLED=true` and start `pnpm dev:zyfai-mcp` (API `:3000`, MCP `:3005`).
3. Point Cursor at `zyfai-mcp-server.local` (default in workspace `mcp.json`).
4. Complete OAuth with scopes that include `mcp:tools:write:deposit` (and configure if testing settings).
5. **Prepare:** `prepare_deposit` on Base (small USDC amount) → return `signingUrl` to the user.
6. **Sign outside Cursor:** Open `signingUrl` in the system browser; complete transfer on zyf.ai (signing page labels the client **Cursor** when OAuth client id maps correctly).
7. **Poll:** `wait_for_deposit_handover` or `get_deposit_status` with `actionId` until `depositId` is set.
8. **Allocate:** `wait_for_deposit_position` with `depositId` until `positioned` or skipped.
9. **Withdraw:** Partial `withdraw` → `lifecycle.id` → `wait_for_withdraw_settlement` then `wait_for_withdraw_complete` (or poll `get_withdraw_status`).
10. **Fallback:** Manual tx + `register_deposit` if the signing page did not register.

For agent-driven prod smoke without opening chat, use workspace skill `.cursor/skills/zyfai-defi-mcp/` (`Mode: prod` or `local`).

Record OAuth friction (missing scopes, redirect, CIMD) in the PR if step 2 or 4 fails.
