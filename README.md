# Zyfai DeFi MCP Server 🛠️

A production-ready Model Context Protocol (MCP) server that exposes Zyfai DeFi APIs through 17 powerful tools. Built on top of the [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk) and supports HTTP/SSE transport for deployment on Digital Ocean Droplets with complete portfolio management, analytics, and DeFi opportunities discovery.

## Features

- ✅ **17 MCP Tools** for complete DeFi workflow
- ✅ **Portfolio Management** - Track positions across all chains
- ✅ **Opportunities Discovery** - Find safe and degen yield opportunities
- ✅ **Analytics & Metrics** - Earnings, TVL, volume, and more
- ✅ **Historical Data** - Transaction history and APY tracking
- ✅ **Multi-Chain Support** - Base (8453), Arbitrum (42161), Plasma (9745)
- ✅ HTTP/SSE transport for web-accessible endpoints
- ✅ Express.js server with CORS support
- ✅ Production-ready with PM2 process management
- ✅ Comprehensive error handling & TypeScript
- ✅ Built with [@modelcontextprotocol/sdk](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)
- ✅ Powered by [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk)

## Available Tools

### Portfolio Management (2 tools)

- `get-debank-portfolio` - Get multi-chain portfolio information using Debank
- `get-positions` - Get all active DeFi positions for a user's wallet

### Opportunities Discovery (3 tools)

- `get-safe-opportunities` - Get safe (low risk) DeFi opportunities
- `get-degen-strategies` - Get degen (high-risk, high-reward) yield strategies
- `get-available-protocols` - Get available DeFi protocols and pools for a chain

### Analytics & Metrics (8 tools)

- `get-onchain-earnings` - Get onchain earnings for a wallet
- `calculate-onchain-earnings` - Calculate/refresh onchain earnings (triggers recalculation)
- `get-daily-earnings` - Get daily earnings for a wallet within a date range
- `get-tvl` - Get total value locked (TVL) across all Zyfai accounts
- `get-volume` - Get total volume across all Zyfai accounts
- `get-active-wallets` - Get active wallets for a specific chain
- `get-smart-wallet-by-eoa` - Get smart wallets associated with an EOA address
- `get-rebalance-frequency` - Get rebalance frequency/tier for a wallet
- `get-apy-per-strategy` - Get APY per strategy for a specific chain

### Historical Data (3 tools)

- `get-history` - Get transaction history for a wallet with pagination
- `get-daily-apy-history` - Get daily APY history with weighted average
- `get-first-topup` - Get the first topup (deposit) information for a wallet

### User Helpers (1 tool)

- `get-user-details` - Get current authenticated user details (requires authentication)

## Project Structure

```
erc8004-mcp-server/
├── index.ts                              # Main HTTP/SSE server entry point
├── index-stdio.ts                        # STDIO server for Claude Desktop
├── src/
│   ├── config/
│   │   └── env.ts                        # Environment configuration
│   ├── services/
│   │   └── zyfai-api.service.ts          # Zyfai SDK wrapper service
│   ├── tools/
│   │   ├── index.ts                      # Tool registration
│   │   ├── portfolio.tools.ts             # Portfolio tools (2 tools)
│   │   ├── opportunities.tools.ts        # Opportunities tools (3 tools)
│   │   ├── analytics.tools.ts             # Analytics tools (8 tools)
│   │   ├── historical.tools.ts           # Historical data tools (3 tools)
│   │   └── helpers.tools.ts              # Helper tools (1 tool)
│   ├── routes/
│   │   └── http.routes.ts                # HTTP/SSE routes
│   ├── middleware/
│   │   └── index.ts                       # Middleware (logger, error handler)
│   └── types/
│       └── zyfai-api.types.ts            # TypeScript type definitions
├── package.json                          # Project dependencies
├── tsconfig.json                         # TypeScript configuration
├── ecosystem.config.cjs                  # PM2 configuration
├── Dockerfile                            # Docker configuration
├── setup-domain.sh                       # Domain setup script
└── build/                                # Compiled JavaScript output
```

## Getting Started

### Prerequisites

- Node.js >= 18.0.0
- pnpm (or npm)
- Zyfai API Key (optional, for authenticated endpoints)

### Local Development

1. Clone the repository:

```bash
git clone [your-repo-url] zyfai-defi-mcp
cd zyfai-defi-mcp
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
- SSE endpoint: `http://localhost:3005/sse`
- Health check: `http://localhost:3005/health`

### Development Mode

```bash
pnpm run dev
```

This will build and start the server in development mode.

## Supported Chains

The MCP server supports the following chains (as defined by `SupportedChainId` in `@zyfai/sdk`):

- **Base** (Chain ID: `8453`)
- **Arbitrum** (Chain ID: `42161`)
- **Sonic** (Chain ID: `9745`)

When using tools that require a chain ID, you must use one of these exact values. The tools use strict TypeScript types to ensure only supported chains are used.

## Client Integration

### Using with Web Applications

The server uses SSE (Server-Sent Events) transport, making it accessible from web browsers and HTTP clients:

```javascript
// Example: Connecting to the MCP server
const sseUrl = "https://your-domain.com/sse";
const eventSource = new EventSource(sseUrl);

eventSource.onmessage = (event) => {
  console.log("Received:", event.data);
};
```

### Using with Claude Desktop

For **remote HTTP/SSE server** (e.g., deployed on Digital Ocean):

```json
{
  "mcpServers": {
    "zyfai-defi": {
      "command": "npx",
      "args": ["mcp-remote", "https://mcp.zyf.ai/sse", "--allow-http"]
    }
  }
}
```

For **local stdio server** (recommended for Claude Desktop):

```json
{
  "mcpServers": {
    "zyfai-defi": {
      "command": "node",
      "args": ["/path/to/erc8004-mcp-server/build/index-stdio.js"]
    }
  }
}
```

### Example Tool Call

```javascript
// Example: Get safe opportunities on Base
const response = await fetch("https://your-domain.com/messages?sessionId=xxx", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    method: "tools/call",
    params: {
      name: "get-safe-opportunities",
      arguments: {
        chainId: 8453,
      },
    },
  }),
});
```

## Production Deployment

### Using PM2

1. Build the project:

```bash
pnpm run build
```

2. Start with PM2:

```bash
pm2 start ecosystem.config.cjs
```

3. Monitor:

```bash
pm2 status
pm2 logs zyfai-mcp-server
pm2 monit
```

### Using Docker

```bash
# Build image
docker build -t zyfai-defi-mcp .

# Run container
docker run -p 3005:3005 \
  -e PORT=3005 \
  -e ZYFAI_API_KEY=your_key_here \
  -e ALLOWED_ORIGINS="*" \
  zyfai-defi-mcp
```

### Digital Ocean Deployment

1. **SSH into your droplet:**

   ```bash
   ssh root@your-droplet-ip
   ```

2. **Clone and setup:**

   ```bash
   git clone [your-repo-url] /var/www/zyfai-mcp-server
   cd /var/www/zyfai-mcp-server
   pnpm install
   pnpm run build
   ```

3. **Configure environment:**

   ```bash
   # Create .env file
   nano .env
   # Add: ZYFAI_API_KEY=your_key_here
   ```

4. **Start with PM2:**

   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```

5. **Configure nginx (optional, for custom domain):**

   ```bash
   # Run the domain setup script
   sudo bash setup-domain.sh

   # Or manually configure nginx (see setup-domain.sh for commands)
   ```

6. **Add DNS record in Cloudflare:**
   - Add A record: `mcp` → `your-droplet-ip`
   - Enable proxy (orange cloud) for SSL
   - Domain will be accessible at `https://mcp.zyf.ai`

## Environment Variables

Configure your server using environment variables:

| Variable          | Description                            | Default       | Required            |
| ----------------- | -------------------------------------- | ------------- | ------------------- |
| `PORT`            | Server port                            | `3005`        | No                  |
| `HOST`            | Host to bind to                        | `0.0.0.0`     | No                  |
| `ZYFAI_API_KEY`   | Zyfai API key                          | -             | Yes (for API calls) |
| `ALLOWED_ORIGINS` | CORS allowed origins (comma-separated) | `*`           | No                  |
| `NODE_ENV`        | Environment mode                       | `development` | No                  |

## Available Scripts

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm start` - Start the production HTTP/SSE server (`build/index.js`)
- `pnpm run dev` - Build and start in development mode
- `pnpm run clean` - Clean build directory

**Note:** The project includes both:

- `index.ts` - HTTP/SSE server for web/remote access
- `index-stdio.ts` - STDIO server for Claude Desktop (local)

## SDK Methods Coverage

This MCP server exposes all read-only/public data methods from the [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk):

✅ **Included:**

- `getAvailableProtocols` → `get-available-protocols`
- `getPositions` → `get-positions`
- `getUserDetails` → `get-user-details`
- `getTVL` → `get-tvl`
- `getVolume` → `get-volume`
- `getActiveWallets` → `get-active-wallets`
- `getSmartWalletByEOA` → `get-smart-wallet-by-eoa`
- `getFirstTopup` → `get-first-topup`
- `getHistory` → `get-history`
- `getOnchainEarnings` → `get-onchain-earnings`
- `calculateOnchainEarnings` → `calculate-onchain-earnings`
- `getDailyEarnings` → `get-daily-earnings`
- `getDebankPortfolio` → `get-debank-portfolio`
- `getSafeOpportunities` → `get-safe-opportunities`
- `getDegenStrategies` → `get-degen-strategies`
- `getDailyApyHistory` → `get-daily-apy-history`
- `getRebalanceFrequency` → `get-rebalance-frequency`
- `getAPYPerStrategy` → `get-apy-per-strategy`

❌ **Excluded (require wallet connection/signing):**

- `connectAccount` - Requires wallet provider
- `disconnectAccount` - Requires wallet connection
- `deploySafe` - Requires wallet signing
- `createSessionKey` - Requires wallet signing
- `depositFunds` - Requires wallet signing
- `withdrawFunds` - Requires wallet signing
- `getSmartWalletAddress` - Requires wallet connection
- `updateUserProfile` - Requires authentication

## Error Handling

All tools return structured error responses:

```json
{
  "content": [
    {
      "type": "text",
      "text": "Error message here"
    }
  ],
  "isError": true
}
```

## Monitoring

Once deployed, monitor your server with:

```bash
# View PM2 status
pm2 status

# View logs
pm2 logs zyfai-mcp-server

# Monitor resources
pm2 monit

# View health check
curl http://localhost:3005/health

# View health check (if deployed with domain)
curl https://mcp.zyf.ai/health
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC

## Related Projects

- [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk) - Zyfai TypeScript SDK
- [@modelcontextprotocol/sdk](https://docs.anthropic.com/en/docs/agents-and-tools/mcp) - Model Context Protocol SDK
