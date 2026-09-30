# Zyfai DeFi MCP Server

Streamable HTTP [MCP](https://modelcontextprotocol.io) server over [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk). Exposes Zyfai portfolio, opportunity, analytics, and earnings reads (plus agent-oriented tools when OAuth is enabled).

**Production:** [https://mcp.zyf.ai/mcp](https://mcp.zyf.ai/mcp) · **Health:** `/health`

This repo is **not** [zyf-knowledge-mcp](https://github.com/ondefy/zyf-knowledge-mcp) (internal code search; workspace Cursor alias `zyfai-mcp`).

## Documentation map

| Audience | Start here |
| --- | --- |
| MCP users and integrators | [Zyfai MCP Server on docs.zyf.ai](https://docs.zyf.ai/docs/sdk/mcp-server) — endpoints, auth, tools, client setup |
| Agents and LLM builders | [Agent Quickstart](https://docs.zyf.ai/docs/sdk/agent-quickstart) — execution via `@zyfai/sdk` |
| Contributors in this repo | [`AGENTS.md`](AGENTS.md) — architecture, env, `pnpm run check`, review policy |

## Use the hosted server

Point any Streamable HTTP MCP client at `https://mcp.zyf.ai/mcp`. Cursor example:

```json
{
  "mcpServers": {
    "zyfai-defi": {
      "url": "https://mcp.zyf.ai/mcp",
      "transport": "http"
    }
  }
}
```

More clients (Claude Code, Desktop, TypeScript): see [docs.zyf.ai](https://docs.zyf.ai/docs/sdk/mcp-server#client-setup).

## Run locally

**Requirements:** Node.js 18+, pnpm.

```bash
git clone https://github.com/ondefy/zyfai-mcp-server
cd zyfai-mcp-server
cp .env.example .env   # set ZYFAI_API_KEY (https://sdk.zyf.ai/)
pnpm install
pnpm run check
pnpm start
```

- MCP: `http://localhost:3005/mcp`
- Default port `3005` (`PORT` in `.env`)

For workspace-linked SDK dev (`dev:watch`, `ZYFAI_BACKEND_ENV=local`), see [`AGENTS.md`](AGENTS.md#commands).

## Configuration

Copy [`.env.example`](.env.example). Common variables:

| Variable | Purpose |
| --- | --- |
| `ZYFAI_API_KEY` | Partner SDK key (required for live API calls) |
| `MCP_AUTH_REQUIRED` | `true` in production (OAuth); `false` for local legacy mode |
| `PORT` / `HOST` / `ALLOWED_ORIGINS` | HTTP server |

Full list and backend URL overrides: `.env.example` and [`AGENTS.md`](AGENTS.md#environment).

## Scripts

| Command | Purpose |
| --- | --- |
| `pnpm run check` | Canonical validation (typecheck + build) |
| `pnpm start` | HTTP server (`build/index.js`) |
| `pnpm run dev` | Build and start once |
| `pnpm run start:stdio` | STDIO entry for local MCP hosts |

## Related

- [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk)
- [@modelcontextprotocol/sdk](https://github.com/modelcontextprotocol/typescript-sdk)

## License

ISC
