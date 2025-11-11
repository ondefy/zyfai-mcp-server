# ZyFAI Rebalancing MCP Server 🛠️

A production-ready Model Context Protocol (MCP) server that exposes ZyFAI DeFi APIs through 15 powerful tools. Supports HTTP/SSE transport for deployment on Digital Ocean Droplets with complete portfolio management, rebalancing, and DeFi opportunities discovery.

<a href="https://glama.ai/mcp/servers/vnt96edg3a">
  <img width="380" height="200" src="https://glama.ai/mcp/servers/vnt96edg3a/badge" alt="ZyFAI Rebalancing MCP Server" />
</a>

## Features

- ✅ **15 MCP Tools** for complete DeFi workflow
- ✅ **Portfolio Management** - Track positions across all chains
- ✅ **Opportunities Discovery** - Find top DeFi yields
- ✅ **Rebalancing** - Automated optimization recommendations
- ✅ **Safe7579 Integration** - Smart contract wallet support
- ✅ **ERC-8004 Session Keys** - Automated operations
- ✅ **x402 Payment Integration** - Monetize premium endpoints with crypto payments
- ✅ HTTP/SSE transport for web-accessible endpoints
- ✅ Express.js server with CORS support
- ✅ Production-ready with PM2 process management
- ✅ Comprehensive error handling & TypeScript
- ✅ Built with [@modelcontextprotocol/sdk](https://docs.anthropic.com/en/docs/agents-and-tools/mcp)

## 💰 x402 Payment Integration (NEW!)

This server now supports **x402 protocol** for monetizing premium endpoints with crypto micropayments:

### Premium Endpoints (Paid with USDC)

- `get-multichain-portfolio` - **1.0 USDC** - Complete multi-chain portfolio data
- `get-best-positions` - **0.75 USDC** - AI-powered position recommendations
- `get-user-earnings` - **0.5 USDC** - Detailed earnings history

### Quick Setup

1. **Enable x402**: Set `X402_ENABLED=true` in your `.env`
2. **Choose Facilitator**: Use public facilitator (no hosting needed!)
   - Recommended: `https://facilitator.x402.rs`
   - Supports: Base, Solana, Avalanche, Polygon, Sei, XDC
3. **Set Receiver**: Add your wallet address to `X402_RECEIVER_ADDRESS`
4. **No API Keys**: Public facilitators are free and gasless

📖 **[Full x402 Integration Guide →](./X402_INTEGRATION.md)**

### Benefits

- ✨ **No Facilitator Hosting Required** - Use free public services
- 💰 **Instant Payments** - USDC sent directly to your wallet
- ⛽ **Gasless** - Facilitator covers gas fees
- 🌐 **Multi-Chain** - Base, Solana, Avalanche, and more
- 🔒 **Secure** - Payment verification before execution

## Project Structure

```
zyfai-sdk-mcp/
├── index.ts                              # Main server with 15 MCP tools
├── src/
│   ├── services/
│   │   └── zyfai-api.service.ts          # ZyFAI API client wrapper
│   └── types/
│       └── zyfai-api.types.ts            # TypeScript type definitions
├── package.json                          # Project dependencies
├── tsconfig.json                         # TypeScript configuration
├── ecosystem.config.cjs                  # PM2 configuration
├── .env.example                          # Environment variables template
├── MCP_TOOLS.md                          # Complete tools documentation
└── build/                                # Compiled JavaScript output
```

## Getting Started

### Local Development

1. Clone this template:

```bash
git clone [your-repo-url] my-mcp-server
cd my-mcp-server
```

2. Install dependencies:

```bash
pnpm install
```

3. Create environment file:

```bash
cp .env.example .env
```

4. Build the project:

```bash
pnpm run build
```

5. Start the server:

```bash
pnpm start
```

The server will be running at:

- Main endpoint: `http://localhost:3005/`
- SSE endpoint: `http://localhost:3005/sse`
- Health check: `http://localhost:3005/health`

6. Configure ZyFAI API (optional):

```bash
# Edit .env and add your ZyFAI API configuration
nano .env
# Set ZYFAI_API_URL (default: https://defiapi.zyf.ai)
# Optionally set ZYFAI_API_KEY if required
```

### Production Deployment on Digital Ocean

See the comprehensive [DEPLOYMENT.md](./DEPLOYMENT.md) guide for detailed instructions.

**Quick Deploy:**

```bash
# SSH into your droplet
ssh root@your-droplet-ip

# Clone and navigate to project
git clone [your-repo-url] /var/www/zyfai-mcp-server
cd /var/www/zyfai-mcp-server

# Run automated deployment
sudo bash deploy.sh
```

Your MCP server will be accessible at: `http://your-droplet-ip/sse`

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

### Using with MCP Clients

You can also connect using any MCP-compatible client by pointing to your HTTP endpoint:

```json
{
  "mcpServers": {
    "zyfai-rebalancing": {
      "url": "https://your-domain.com/sse",
      "transport": "sse"
    }
  }
}
```

## Development

The template includes a sample tool implementation in `index.ts`. To create your own tools:

1. Modify the server configuration in `index.ts`:

```typescript
const server = new McpServer({
  name: "your-mcp-name",
  version: "0.0.1",
});
```

2. Define your custom tools using the `server.tool()` method:

```typescript
server.tool(
  "your-tool-name",
  "Your tool description",
  {
    // Define your tool's parameters using Zod schema
    parameter: z.string().describe("Parameter description"),
  },
  async ({ parameter }) => {
    // Implement your tool's logic here
    return {
      content: [
        {
          type: "text",
          text: "Your tool's response",
        },
      ],
    };
  }
);
```

3. Build and test your implementation:

```bash
pnpm run build
pnpm start
```

4. Test the health endpoint:

```bash
curl http://localhost:3000/health
```

## Available Scripts

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm start` - Start the production server
- `pnpm run dev` - Build and start in development mode
- `pnpm run clean` - Clean build directory

## Environment Variables

Configure your server using environment variables (see `.env.example`):

- `PORT` - Server port (default: 3000)
- `HOST` - Host to bind to (default: 0.0.0.0)
- `ALLOWED_ORIGINS` - CORS allowed origins (comma-separated)
- `NODE_ENV` - Environment mode (production/development)

## Docker Deployment

Build and run using Docker:

```bash
# Build image
docker build -t zyfai-mcp-server .

# Run container
docker run -p 3000:3000 \
  -e PORT=3000 \
  -e ALLOWED_ORIGINS="*" \
  zyfai-mcp-server
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
```

## Contributing

Feel free to submit issues and enhancement requests!

## License

MIT
