# zyfai-mcp-server

Public **DeFi MCP** over [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk). Streamable HTTP at `/mcp`. Prod read URL: [https://mcp.zyf.ai](https://mcp.zyf.ai). Write tools are opt-in per deployment (`MCP_WRITE_TOOLS_ENABLED`).

**Not** [zyf-knowledge-mcp](https://github.com/ondefy/zyf-knowledge-mcp) (internal code/docs search; Cursor alias `zyfai-mcp` in the parent workspace).

When cloned inside [zyfai-workspace](https://github.com/ondefy/zyfai-workspace), read parent `../AGENTS.md` for the repository map.

## Architecture

```text
index.ts → src/routes/http.routes.ts → src/tools/* → ZyfaiApiService → ZyfaiSDK
```

- **HTTP:** `index.ts` (default `PORT` 3005). Streamable HTTP is the only supported transport. OAuth challenges are HTTP `401` plus `WWW-Authenticate`, which STDIO cannot express, so the old stdio and proxy entrypoints are not part of this server.

Partner `ZYFAI_API_KEY` backs anonymous discovery: **`find_opportunities`**, **`compare_opportunities`**, and legacy **`get-available-protocols`** (only when `MCP_REGISTER_LEGACY_PROTOCOL_TOOLS=true`). Authenticated reads and writes use MCP OAuth: bearer → delegated agent JWT via [`src/auth/session-credential.ts`](src/auth/session-credential.ts) and [`ZyfaiApiService.sdkForUserScoped`](src/services/zyfai-api.service.ts).

## Authentication and tenancy

- HTTP OAuth: [`src/middleware/mcp-auth.middleware.ts`](src/middleware/mcp-auth.middleware.ts) + [`src/auth/request-context.ts`](src/auth/request-context.ts).
- Personal tools resolve wallets from the session only ([`src/auth/user-scope.ts`](src/auth/user-scope.ts)): EOA from the token for portfolio/positions; smart wallet from `getUserDetails()` for history, earnings, and rebalance tier. **Never** accept a foreign `userAddress` / `walletAddress` on MCP tools.
- `MCP_AUTH_REQUIRED` controls whether a bearer is mandatory, not whether a bearer is processed. A supplied bearer is always verified and becomes the user context. A missing bearer with auth required is `401` for the whole `/mcp` endpoint. A missing bearer with auth optional stays anonymous: public discovery tools run, and a protected `tools/call` returns `401` with `WWW-Authenticate` so the host can start OAuth. Personal tools never run without that session.

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
pnpm run check    # tsc --noEmit + build + unit tests — canonical validation
pnpm run test:unit
pnpm run test:integration   # opt-in; .env.test + ZYFAI_ENV (not part of check)
pnpm run build
pnpm start        # production HTTP server (build/index.js)
pnpm run dev      # build + start (one shot)
pnpm run dev:watch # tsc -w + nodemon (single compile pass); restarts on MCP build or linked SDK entry files
```

### Local SDK + live reload (from workspace root)

When `zyfai-workspace`, `zyfai-sdk`, and `zyfai-mcp-server` are sibling submodules:

```bash
cp zyfai-mcp-server/.env.example zyfai-mcp-server/.env   # ZYFAI_API_KEY required for live API calls
pnpm dev:zyfai-mcp:link   # build SDK + gitignored pnpm-workspace.yaml override (once per clone)
pnpm dev:zyfai-mcp        # zyfai-api :3000 + SDK tsup --watch + MCP dev:watch on :3005
```

MCP endpoint: `http://localhost:3005/mcp` (health: `/health`). Point Cursor at that URL with `transport: "http"` instead of prod `https://mcp.zyf.ai/mcp`.

With `MCP_AUTH_REQUIRED=true`, `zyfai-api` must be up for OAuth (`MCP_OAUTH_JWT_SECRET` / `MCP_RESOURCE_URL` aligned in both `.env` files). `dev:zyfai-mcp` starts the API; wait for `:3000` before expecting Cursor OAuth to succeed.

**New-user deposit E2E (local):** run the wallet pool (`pnpm dev:predeployment` from workspace root) so MCP OAuth can reserve a Safe; set `MCP_WRITE_TOOLS_ENABLED=true` and `ZYFAI_WEB_SIGNING_BASE=https://localhost:4004` (monorepo `pnpm dev:zyfi`; mkcert HTTPS — not plain `http://`). Complete OAuth for the MCP client, then call `prepare_deposit` (persists first-chain profile via `POST /users/me/agent-deposit-setup` when needed) before the user signs via `signingUrl`.

From workspace root, full stack with MCP: `pnpm dev -- --mcp` (or `pnpm dev:mcp`) adds pool + frontend. Sets `ZYFAI_BACKEND_ENV=local` on the MCP process (execution → `http://localhost:3000`). For opportunity reads, set `ZYFAI_DATA_API_URL` in `.env` to staging defi-api unless you run `zyfai-defi-api` locally on `:3000`.

Restore npm `@zyfai/sdk`: `rm zyfai-mcp-server/pnpm-workspace.yaml && cd zyfai-mcp-server && pnpm install`.

### Integration testing

Opt-in Vitest suites in `src/integration/*.integration.test.ts` (pattern matches `zyfai-sdk/src/integration`). They are **not** part of `pnpm run check`.

**Local (default in `env.test.example`):** execution API on `:3000`, data API on staging defi-api (same hybrid as `.env` for dev). `zyfai-mcp-server/.env.test` overrides `../zyfai-sdk/.env.test` — set `ZYFAI_ENV=local` there; do not copy `.env` into `.env.test`.

```bash
# Terminal 1 — from workspace root (API + MCP, or pnpm dev:zyfai-api alone)
pnpm dev:zyfai-mcp

# Terminal 2 — waits for :3000 then runs suites
pnpm test:zyfai-mcp:integration:local
# or inside zyfai-mcp-server: pnpm run test:integration:local
```

```bash
cp env.test.example .env.test
pnpm run test:integration              # uses ZYFAI_ENV from .env.test
pnpm run test:integration:local        # forces local + wait-on :3000
ZYFAI_ENV=staging pnpm run test:integration
MCP_INTEGRATION_BASE_URL=http://127.0.0.1:3005 pnpm run test:integration
```

`applyIntegrationServerEnv()` maps `ZYFAI_ENV` → `ZYFAI_BACKEND_ENV` and applies the local data-api default when unset. Helpers: `src/integration/utils.ts` only.

Docker: `pnpm-lock.yaml` + `Dockerfile` (default `PORT=3005`). PM2: `ecosystem.config.cjs`.

## Repository map

| Path | Role |
| --- | --- |
| `src/tools/` | MCP tool registration (agent, protocol, user session, earnings) |
| `src/services/zyfai-api.service.ts` | Thin SDK wrapper |
| `src/config/env.ts` | Environment |
| `src/config/chains.ts` | Shared chain Zod schemas |

Repo overview: [`README.md`](README.md). Public tool list, auth, and client setup: [docs.zyf.ai MCP guide](https://docs.zyf.ai/docs/sdk/mcp-server).

## Task completion

1. Change tools or SDK calls → run `pnpm run check`.
2. Bump `@zyfai/sdk` only when intentional; align `src/config/chains.ts` if `SupportedChainId` changes.
3. User-facing contract: update `sdk-api-docs` `docs/sdk/mcp-server.md` when tools, auth, or client setup change; keep `README.md` as a short pointer only.

## Code review

**Only raise an issue when there is a concrete reason to believe the PR introduces incorrect behaviour or meaningful risk.** Silence is success.

| Automated PR base branch | Mode | CI policy |
| --- | --- | --- |
| `main` | Functional | [`.agents/review/functional.md`](.agents/review/functional.md) |
| `release` | Release | [`.agents/review/release.md`](.agents/review/release.md) |

These `.agents/review/` policies are for automated CI and its JSON result only. For interactive reviews, follow the parent workspace `review-change` → `functional-reviewer` route.
