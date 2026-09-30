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
pnpm run dev      # build + start
pnpm run start:stdio
```

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
