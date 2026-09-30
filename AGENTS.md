# zyfai-mcp-server

Public **DeFi read MCP** over [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk). Streamable HTTP at `/mcp`. Prod: [https://mcp.zyf.ai](https://mcp.zyf.ai).

**Not** [zyf-knowledge-mcp](https://github.com/ondefy/zyf-knowledge-mcp) (internal code/docs search; Cursor alias `zyfai-mcp` in the parent workspace).

When cloned inside [zyfai-workspace](https://github.com/ondefy/zyfai-workspace), read parent `../AGENTS.md` for the repository map.

## Architecture

```text
index.ts → src/routes/http.routes.ts → src/tools/* → ZyfaiApiService → ZyfaiSDK
```

- **HTTP:** `index.ts` (default `PORT` 3005).
- **STDIO:** `index-stdio.ts` for local Claude Desktop-style hosts.
- **Proxy:** `proxy-server.ts` bridges stdio to a remote `/mcp` URL.

Today the server uses a single partner `ZYFAI_API_KEY` on a singleton SDK instance. No per-user OAuth or write tools yet.

## Environment

See `.env.example`. Required for live API calls:

| Variable | Role |
| --- | --- |
| `ZYFAI_API_KEY` | Partner SDK key ([sdk.zyf.ai](https://sdk.zyf.ai)) |
| `ZYFAI_BACKEND_ENV` | `local` \| `staging` \| `production` — SDK base URLs (default: production) |
| `ZYFAI_EXECUTION_API_URL` | Override execution API origin (no `/api/v1` suffix) |
| `ZYFAI_DATA_API_URL` | Override data API origin (no `/api/v2` suffix); use when local defi-api is not on `:3000` |
| `PORT` | HTTP port (default `3005`) |
| `HOST` | Bind address (default `0.0.0.0`) |
| `ALLOWED_ORIGINS` | CORS (comma-separated, default `*`) |

## Chains and strategies

- **Chains:** only `@zyfai/sdk` `SupportedChainId`: `1`, `8453`, `42161`. Tool schemas live in `src/config/chains.ts`.
- Data-only chains on defi-api (e.g. Plasma `9745`) are **not** exposed here until the SDK adds them.
- **Strategies:** MCP tool names use public `conservative` / `aggressive`; the SDK maps to `safe` / `degen` internally.

## Commands

```bash
pnpm install
pnpm run check    # tsc --noEmit + build — canonical validation
pnpm run build
pnpm start        # production HTTP server (build/index.js)
pnpm run dev      # build + start (one shot)
pnpm run dev:watch # tsc + nodemon; restarts when MCP sources or ../zyfai-sdk/dist change
pnpm run start:stdio
```

### Local SDK + live reload (from workspace root)

When `zyfai-workspace`, `zyfai-sdk`, and `zyfai-mcp-server` are sibling submodules:

```bash
cp zyfai-mcp-server/.env.example zyfai-mcp-server/.env   # ZYFAI_API_KEY required for live API calls
pnpm dev:zyfai-mcp:link   # build SDK + gitignored pnpm-workspace.yaml override (once per clone)
pnpm dev:zyfai-mcp        # SDK tsup --watch + MCP dev:watch on :3005
```

MCP endpoint: `http://localhost:3005/mcp` (health: `/health`). Point Cursor at that URL with `transport: "http"` instead of prod `https://mcp.zyf.ai/mcp`.

From workspace root, full stack with MCP: `pnpm dev -- --mcp` (or `pnpm dev:mcp`). Sets `ZYFAI_BACKEND_ENV=local` on the MCP process (execution → `http://localhost:3000`). For opportunity/TVL-style reads, set `ZYFAI_DATA_API_URL` in `.env` to staging defi-api unless you run `zyfai-defi-api` locally on `:3000`.

Restore npm `@zyfai/sdk`: `rm zyfai-mcp-server/pnpm-workspace.yaml && cd zyfai-mcp-server && pnpm install`.

Docker: `pnpm-lock.yaml` + `Dockerfile` (default `PORT=3005`). PM2: `ecosystem.config.cjs`.

## Repository map

| Path | Role |
| --- | --- |
| `src/tools/` | MCP tool registration (15 read tools) |
| `src/services/zyfai-api.service.ts` | Thin SDK wrapper |
| `src/config/env.ts` | Environment |
| `src/config/chains.ts` | Shared chain Zod schemas |

Public tool list and client setup: [`README.md`](README.md). Product docs: [docs.zyf.ai MCP guide](https://docs.zyf.ai/docs/sdk/mcp-server).

## Task completion

1. Change tools or SDK calls → run `pnpm run check`.
2. Bump `@zyfai/sdk` only when intentional; align `src/config/chains.ts` if `SupportedChainId` changes.
3. Update `README.md` tool catalogue if names or parameters change.
4. User-facing docs: update `sdk-api-docs` `docs/sdk/mcp-server.md` when the public MCP contract changes.

## Code review

**Only raise an issue when there is a concrete reason to believe the PR introduces incorrect behaviour or meaningful risk.** Silence is success.

| Automated PR base branch | Mode | CI policy |
| --- | --- | --- |
| `main` | Functional | [`.agents/review/functional.md`](.agents/review/functional.md) |
| `release` | Release | [`.agents/review/release.md`](.agents/review/release.md) |

These `.agents/review/` policies are for automated CI and its JSON result only. For interactive reviews, follow the parent workspace `review-change` → `functional-reviewer` route.

## Forward work

OAuth, per-user JWT, scoped reads, and deposit write paths are designed in the workspace plan `mcp_agent_interface` (parent `.cursor/plans/`). Extend this `AGENTS.md` auth section when that lands; do not replace harness sections.
