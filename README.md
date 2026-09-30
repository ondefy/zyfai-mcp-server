# Zyfai DeFi MCP Server

A production-ready Model Context Protocol (MCP) server that exposes Zyfai DeFi APIs through 15 powerful tools. Built on top of the [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk) and supports **Streamable HTTP** transport (MCP 2024-11-05+) with complete portfolio management, analytics, and DeFi opportunities discovery.

You can make use of the official Zyfai mcp server deployed [here](https://mcp.zyf.ai) or run your own.

## Features

- **15 MCP Tools** for complete DeFi workflow
- **Portfolio Management** - Track positions across all chains
- **Opportunities Discovery** - Find conservative and aggressive yield opportunities
- **Analytics & Metrics** - TVL, volume, wallet analytics, and more
- **Earnings Tracking** - Onchain earnings, daily earnings, APY history
- **User Data** - Transaction history, positions, first topup info
- **Multi-Chain Support** - Ethereum Mainnet (1), Base (8453), Arbitrum (42161)
- **Streamable HTTP transport** - Modern unified `/mcp` endpoint (MCP 2024-11-05+)
- Session-based with `Mcp-Session-Id` header support
- Express.js server with CORS support
- Production-ready with PM2 process management
- Comprehensive error handling & TypeScript
- Built with [@modelcontextprotocol/sdk](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
- Powered by [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk)

## Transport Update: SSE to Streamable HTTP

This server has been updated from the deprecated SSE transport to **Streamable HTTP** (MCP specification 2024-11-05+):

| Old (Deprecated)                              | New (Current)                               |
| --------------------------------------------- | ------------------------------------------- |
| `/sse` (GET) + `/messages` (POST)             | `/mcp` (unified endpoint)                   |
| Separate endpoints for streaming and messages | Single endpoint handles all operations      |
| Session managed via query params              | Session managed via `Mcp-Session-Id` header |

### Benefits of Streamable HTTP

- **Simpler architecture**: Single unified endpoint for all MCP operations
- **Better infrastructure compatibility**: Works well with proxies, CDNs, and HTTP/2
- **Enhanced resumability**: Better error handling and session recovery
- **Stateless option**: Servers can operate statelessly if desired

## Available Tools

### Protocol (1 tool)

- `get-available-protocols` - Get available DeFi protocols and pools for a specific chain on Zyfai

### Opportunities Discovery (2 tools)

- `get-conservative-opportunities` - Get safe (low risk) DeFi opportunities suitable for conservative investors
- `get-aggressive-opportunities` - Get degen (high-risk, high-reward) yield strategies for aggressive investors

### Analytics & Metrics (6 tools)

- `get-tvl` - Get total value locked (TVL) across all Zyfai accounts
- `get-volume` - Get total volume across all Zyfai accounts
- `get-active-wallets` - Get active wallets for a specific chain on Zyfai
- `get-smart-wallet-by-eoa` - Get smart wallets associated with an EOA address
- `get-rebalance-frequency` - Get rebalance frequency/tier for a wallet
- `get-apy-per-strategy` - Get APY per strategy for a specific chain

### User Data (3 tools)

- `get-positions` - Get all active DeFi positions and portfolio for a user's wallet address
- `get-history` - Get transaction history for a wallet with pagination
- `get-first-topup` - Get the first topup (deposit) information for a wallet

### Earnings (3 tools)

- `get-onchain-earnings` - Get onchain earnings for a wallet including total, current, and lifetime earnings
- `get-daily-earnings` - Get daily earnings for a wallet within a date range
- `get-daily-apy-history` - Get daily APY history for a wallet

## Project Structure

```
zyfai-mcp-server/
├── index.ts                              # Main Streamable HTTP server entry point
├── index-stdio.ts                        # STDIO server for Claude Desktop
├── proxy-server.ts                       # Proxy for remote Streamable HTTP server
├── src/
│   ├── config/
│   │   └── env.ts                        # Environment configuration
│   ├── services/
│   │   └── zyfai-api.service.ts          # Zyfai SDK wrapper service
│   ├── tools/
│   │   ├── index.ts                      # Tool registration
│   │   ├── protocol.tools.ts             # Protocol tools (1 tool)
│   │   ├── opportunities.tools.ts        # Opportunities tools (2 tools)
│   │   ├── analytics.tools.ts            # Analytics tools (6 tools)
│   │   ├── user-data.tools.ts            # User data tools (3 tools)
│   │   └── earnings.tools.ts             # Earnings tools (3 tools)
│   ├── routes/
│   │   └── http.routes.ts                # Streamable HTTP routes
│   └── middleware/
│       └── index.ts                      # Middleware (logger, error handler)
├── package.json                          # Project dependencies
├── tsconfig.json                         # TypeScript configuration
├── ecosystem.config.cjs                  # PM2 configuration
├── Dockerfile                            # Docker configuration
├── setup-domain.sh                       # Domain setup script
└── build/                                # Compiled JavaScript output
```

## Client Integration

### Using with Claude Code

If you'd like to add zyfai mcp server under your claude code, execute the below in a separate terminal, not under a claude code session:

```bash
# Using Streamable HTTP transport (recommended)
claude mcp add --transport http zyfai-agent https://mcp.zyf.ai/mcp
```

### Using with Claude Desktop

For **remote Streamable HTTP server**:

```json
{
  "mcpServers": {
    "zyfai-defi": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.zyf.ai/mcp"]
    }
  }
}
```

### Using with Cursor

Add to your Cursor MCP settings:

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

### Other MCP clients

The server uses Streamable HTTP transport, making it accessible from web browsers and HTTP clients:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Initialize MCP client with Streamable HTTP transport
const transport = new StreamableHTTPClientTransport(
  new URL("https://mcp.zyf.ai/mcp")
);

const client = new Client(
  { name: "my-app", version: "1.0.0" },
  { capabilities: {} }
);

await client.connect(transport);

// List available tools
const tools = await client.listTools();
console.log(
  "Available tools:",
  tools.tools.map((t) => t.name)
);

// Call a tool
const result = await client.callTool({
  name: "get-conservative-opportunities",
  arguments: { chainId: 8453 },
});
```

https://mcp.zyf.ai/mcp

### Testing with MCP Inspector

You can test the server using the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

Then enter the endpoint URL: `https://mcp.zyf.ai/mcp`

### Building LLM-powered DeFi apps

For agent integration patterns, supported chains, auth model, and the full tool catalogue, see the [Zyfai MCP Server guide on docs.zyf.ai](https://docs.zyf.ai/docs/sdk/mcp-server).

For deposits, withdrawals, and execution, use [@zyfai/sdk](https://sdk.zyf.ai/) directly or the [Agent Quickstart](https://docs.zyf.ai/docs/sdk/agent-quickstart).

Agent and contributor conventions for this repository: [`AGENTS.md`](AGENTS.md).

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm (or npm)
- Zyfai API Key (optional, for authenticated endpoints)

### Local Development

1. Clone the repository:

```bash
git clone https://github.com/ondefy/zyfai-mcp-server
cd zyfai-mcp-server
```

2. Install dependencies:

```bash
pnpm install
```

3. Create environment file (optional):

```bash
# Create .env file
cat > .env <<EOF
PORT=3005
HOST=0.0.0.0
ALLOWED_ORIGINS=*
ZYFAI_API_KEY=your_api_key_here
EOF
```

4. Configure environment variables:

Get your ZYFAI_API_KEY from [Zyfai SDK Dashboard](https://sdk.zyf.ai/)

**Note:** The server will start without an API key (shows a warning), but API calls will fail. Set `ZYFAI_API_KEY` in your `.env` file for full functionality.

5. Build the project:

```bash
pnpm run build
```

6. Start the server:

```bash
pnpm start
```

The server will be running at:

- Main endpoint: `http://localhost:3005/`
- MCP endpoint: `http://localhost:3005/mcp`
- Health check: `http://localhost:3005/health`

### Development Mode

```bash
pnpm run dev
```

This will build and start the server in development mode.

## Environment Variables

Configure your server using environment variables:

| Variable          | Description                            | Default   | Required            |
| ----------------- | -------------------------------------- | --------- | ------------------- |
| `PORT`            | Server port                            | `3005`    | No                  |
| `HOST`            | Host to bind to                        | `0.0.0.0` | No                  |
| `ZYFAI_API_KEY`   | Zyfai SDK API key                      | -         | Yes (for API calls) |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*`       | No                  |

## Available Scripts

- `pnpm run check` - Typecheck and build (canonical validation)
- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm start` - Start the production Streamable HTTP server (`build/index.js`)
- `pnpm run start:stdio` - Start the STDIO server for Claude Desktop (`build/index-stdio.js`)
- `pnpm run dev` - Build and start in development mode
- `pnpm run clean` - Clean build directory

**Note:** The project includes:

- `index.ts` - Streamable HTTP server for web/remote access
- `index-stdio.ts` - STDIO server for Claude Desktop (local)
- `proxy-server.ts` - Proxy server bridging stdio to remote Streamable HTTP

## Migration from SSE (Legacy)

If you're upgrading from a previous version using SSE transport:

1. Update `@modelcontextprotocol/sdk` to `^1.12.0` or later
2. Change client transport from `SSEClientTransport` to `StreamableHTTPClientTransport`
3. Update endpoint URLs from `/sse` to `/mcp`
4. Add `Mcp-Session-Id` header handling (automatically managed by the SDK)

**Before (SSE):**

```typescript
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
const transport = new SSEClientTransport(new URL("https://mcp.zyf.ai/sse"));
```

**After (Streamable HTTP):**

```typescript
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
const transport = new StreamableHTTPClientTransport(
  new URL("https://mcp.zyf.ai/mcp")
);
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC

## Related Projects

- [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk) - Zyfai TypeScript SDK
- [@modelcontextprotocol/sdk](https://docs.anthropic.com/en/docs/agents-and-tools/mcp) - Model Context Protocol SDK
