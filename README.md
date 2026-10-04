# Zyfai DeFi MCP Server

Use [Zyfai](https://zyf.ai) from Claude, Grok and Grok Bot, Cursor, Claude Code, compatible custom agents, and a limited ChatGPT preview.

This public [Model Context Protocol](https://modelcontextprotocol.io) server exposes Zyfai's yield discovery and personalized DeFi agent through natural-language tools. Discover opportunities, compare strategies, inspect positions, review earnings, and prepare supported account actions without building a separate integration.

> **Hosted MCP endpoint:** `https://mcp.zyf.ai/mcp`

You do not need to clone or run this repository to use the hosted server.

## What you can do

- Discover conservative and aggressive yield opportunities
- Compare APY, TVL, protocol, pool, chain, asset, and available risk information
- Inspect an authenticated user's Zyfai portfolio and active positions
- Review earnings, transaction history, and rebalancing information
- Prepare supported deposits and account actions when enabled
- Integrate Zyfai into any compatible Streamable HTTP MCP client

The server is built on [`@zyfai/sdk`](https://www.npmjs.com/package/@zyfai/sdk) and uses remote Streamable HTTP transport.

## Connect a client

| Client | How to connect | Positioning |
| --- | --- | --- |
| **Claude** | Add a custom connector using the hosted endpoint | Recommended conversational experience |
| **Cursor** | Add the JSON configuration below | Developer workflows |
| **Claude Code** | Run the command below | Terminal and coding-agent workflows |
| **Grok and Grok Bot** | Add a Custom connector at [grok.com/connectors](https://grok.com/connectors) | Longer-running and repeat agent workflows |
| **ChatGPT** | Limited private preview; currently desktop-only | Public distribution not yet available |
| **Other clients** | Configure the hosted URL as a remote Streamable HTTP server | Custom agents and integrations |

For current screenshots, authentication behaviour, mobile/desktop availability, and troubleshooting, see [Use Zyfai with AI](https://docs.zyf.ai/docs/sdk/mcp-server).

### Cursor

```json
{
  "mcpServers": {
    "zyfai": {
      "url": "https://mcp.zyf.ai/mcp",
      "transport": "http"
    }
  }
}
```

### Claude Code

Run this outside an active Claude Code session:

```bash
claude mcp add --transport http zyfai https://mcp.zyf.ai/mcp
```

### Claude

In Claude, open **Customize → Connectors**, add a custom connector named **Zyfai**, and set the remote MCP URL to `https://mcp.zyf.ai/mcp`. Select **Continue**, then sign in. Full click-path: [Use Zyfai with AI](https://docs.zyf.ai/docs/sdk/mcp-server).

### Grok and Grok Bot

Open [grok.com/connectors](https://grok.com/connectors), select **New Connector → Custom**, and enter the hosted endpoint. In Grok Bot, attach the installed Zyfai connector with `@` when needed.

Grok Bot is the better fit for longer-running or repeat workflows. Grok web also supports the connector for ad hoc conversations, although tool-heavy requests can take longer to complete.

## Try it

Start with public opportunity discovery:

> Using Zyfai, show me conservative USDC opportunities on Base. Compare APY, TVL, protocol, and risk.

Then compare strategies:

> Now compare those with the aggressive strategy and explain the additional risk rather than recommending purely by APY.

After authentication:

> Show my current Zyfai positions and earnings. Do not prepare any transaction.

For a controlled action flow:

> Help me prepare a 1 USDC deposit on Base using the conservative strategy. Explain each step and ask before anything requiring a wallet signature.

## Authentication and safety

Zyfai separates general discovery from personal account access.

- Opportunity and protocol discovery use public market and strategy data.
- Portfolio, position, earnings, history, and personalized tools require an authenticated Zyfai session.
- Supported write flows require authentication and may return a Zyfai signing URL.
- Connecting the MCP server does not transfer assets or give an AI custody of a wallet.
- The server never needs a seed phrase or raw private key from chat.
- Users should verify the chain, asset, amount, strategy, destination, and wallet request before signing.

OAuth challenges are returned through standard HTTP `401` and `WWW-Authenticate` responses so compatible clients can begin the authentication flow.

## Documentation

| Audience | Start here |
| --- | --- |
| AI assistant users | [Use Zyfai with AI](https://docs.zyf.ai/docs/sdk/mcp-server) |
| Application and agent developers | [Zyfai SDK quickstart](https://docs.zyf.ai/docs/sdk/getting-started) |
| SDK-based autonomous agents | [Agent quickstart](https://docs.zyf.ai/docs/sdk/agent-quickstart) |
| MCP server contributors | [`AGENTS.md`](AGENTS.md) |

## Run locally

**Requirements:** Node.js 18+ and pnpm.

```bash
git clone https://github.com/ondefy/zyfai-mcp-server
cd zyfai-mcp-server
cp .env.example .env
pnpm install
pnpm run check
pnpm start
```

Local endpoints:

- MCP: `http://localhost:3005/mcp`
- Health: `http://localhost:3005/health`

Set `ZYFAI_API_KEY` in `.env` for live Zyfai API calls. See [`.env.example`](.env.example) for authentication, backend, CORS, write-tool, and signing configuration.

For workspace-linked SDK development, local OAuth, integration testing, and the full repository architecture, read [`AGENTS.md`](AGENTS.md).

## Validate changes

```bash
pnpm run check
```

This runs TypeScript validation, the production build, and unit tests. Integration suites are opt-in; see [`AGENTS.md`](AGENTS.md#integration-testing).

## Related projects

- [Zyfai](https://zyf.ai)
- [Zyfai documentation](https://docs.zyf.ai)
- [`@zyfai/sdk`](https://www.npmjs.com/package/@zyfai/sdk)
- [Zyfai SDK repository](https://github.com/ondefy/zyfai-sdk)

This public server is separate from `zyf-knowledge-mcp`, Zyfai's internal code and documentation search service.

## License

ISC
