# Zyfai DeFi MCP Server

A production-ready Model Context Protocol (MCP) server that exposes Zyfai DeFi APIs through 17 powerful tools. Built on top of the [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk) using the **Streamable HTTP transport** with complete portfolio management, analytics, and DeFi opportunities discovery.

You can make use of the official Zyfai mcp server deployed [here](https://mcp.zyf.ai) or run your own.

## Features

- **17 MCP Tools** for complete DeFi workflow
- **Portfolio Management** - Track positions across all chains
- **Opportunities Discovery** - Find safe and degen yield opportunities
- **Analytics & Metrics** - Earnings, TVL, volume, and more
- **Historical Data** - Transaction history and APY tracking
- **Multi-Chain Support** - Base (8453), Arbitrum (42161), Plasma (9745)
- **Dual Transport Support** - Both `/mcp` (Streamable HTTP) and `/sse` (SSE) endpoints
- **Per-Client API Keys** - Pass your own Zyfai API key via `x-api-key` header
- Express.js server with CORS support
- Production-ready with PM2 process management
- Comprehensive error handling & TypeScript
- Built with [@modelcontextprotocol/sdk](https://modelcontextprotocol.io/) v1.25+
- Powered by [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk)

## Endpoints

The server supports two transport endpoints:

- **`/mcp`** - Streamable HTTP transport (modern, recommended)
- **`/sse`** - SSE transport (backward compatibility)
- **`/health`** - Health check endpoint
- **`/`** - Server info

Both `/mcp` and `/sse` support the `x-api-key` header for per-client API keys.

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
zyfai-mcp-server/
├── index.ts                              # Main HTTP server entry point (Streamable HTTP)
├── index-stdio.ts                        # STDIO server for Claude Desktop
├── src/
│   ├── config/
│   │   └── env.ts                        # Environment configuration
│   ├── services/
│   │   └── zyfai-api.service.ts          # Zyfai SDK wrapper service
│   ├── tools/
│   │   ├── index.ts                      # Tool registration
│   │   ├── portfolio.tools.ts            # Portfolio tools (2 tools)
│   │   ├── opportunities.tools.ts        # Opportunities tools (3 tools)
│   │   ├── analytics.tools.ts            # Analytics tools (8 tools)
│   │   ├── historical.tools.ts           # Historical data tools (3 tools)
│   │   └── helpers.tools.ts              # Helper tools (1 tool)
│   ├── routes/
│   │   └── http.routes.ts                # Streamable HTTP routes
│   ├── middleware/
│   │   └── index.ts                      # Middleware (logger, error handler)
│   └── types/
│       └── zyfai-api.types.ts            # TypeScript type definitions
├── package.json                          # Project dependencies
├── tsconfig.json                         # TypeScript configuration
├── ecosystem.config.cjs                  # PM2 configuration
├── Dockerfile                            # Docker configuration
├── setup-domain.sh                       # Domain setup script
└── build/                                # Compiled JavaScript output
```

## Client Integration

### 🔑 Using Your Own API Key (Optional)

**By default, the server uses its configured API key** (set via `ZYFAI_API_KEY` environment variable). This works fine for testing, but to access **your own users' wallet data**, you can provide your own Zyfai SDK API key.

**Behavior:**

- ✅ **No `x-api-key` header** → Uses server's API key (default)
- ✅ **With `x-api-key` header** → Uses your API key (recommended for production)

Get your API key: [Zyfai Dashboard](https://dashboard.zyf.ai) → Settings → API Keys

#### Option 1: Pass API Key via HTTP Headers (Optional, for your own data)

When connecting to the MCP server programmatically, you can optionally pass your API key via the `x-api-key` header. If omitted, the server's default API key is used:

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

// Option A: With your own API key (recommended for production)
const transport = new StreamableHTTPClientTransport(
  new URL("https://mcp.zyf.ai/mcp"),
  {
    headers: {
      "x-api-key": "your_zyfai_api_key_here", // Optional
    },
  }
);

// Option B: Without API key (uses server's default key)
const transportDefault = new StreamableHTTPClientTransport(
  new URL("https://mcp.zyf.ai/mcp")
  // No headers needed - automatically uses server's API key
);

const client = new Client(
  {
    name: "my-defi-app",
    version: "1.0.0",
  },
  { capabilities: {} }
);

await client.connect(transport);
```

#### Option 2: Use Server's Default API Key (Easiest)

Simply connect without any headers - the server will use its configured API key:

```typescript
const transport = new StreamableHTTPClientTransport(
  new URL("https://mcp.zyf.ai/mcp")
);
// That's it! Uses server's API key automatically
```

This works great for:

- Testing and development
- Shared team environments
- When you want to use the server owner's wallet data

#### Option 3: Self-Host with Your API Key

For full control, self-host the MCP server with your API key:

1. Clone and deploy this repo
2. Set `ZYFAI_API_KEY=your_key` in your environment
3. Point your client to your deployment (e.g., `http://localhost:3005/mcp`)

See the **Local Development** section below for details.

### Using with Claude Code

Add the Zyfai MCP server to Claude Code using the HTTP transport:

```bash
# Using the hosted server (Zyfai team's API key)
claude mcp add --transport http zyfai-agent https://mcp.zyf.ai/mcp

# Or using your self-hosted server (your API key)
claude mcp add --transport http zyfai-agent http://localhost:3005/mcp
```

### Using with Claude Desktop

**Option A: Self-hosted** (recommended to use your own API key):

```json
{
  "mcpServers": {
    "zyfai-defi": {
      "url": "http://localhost:3005/mcp"
    }
  }
}
```

**Option B: Hosted server** (uses Zyfai team's API key):

```json
{
  "mcpServers": {
    "zyfai-defi": {
      "url": "https://mcp.zyf.ai/mcp"
    }
  }
}
```

Or using the SSE endpoint (backward compatibility):

```json
{
  "mcpServers": {
    "zyfai-defi": {
      "url": "https://mcp.zyf.ai/sse"
    }
  }
}
```

### Using with Cursor / Other MCP Clients

Most MCP clients support HTTP transport natively. Simply point to the `/mcp` endpoint:

```
# Hosted (Zyfai team's data)
https://mcp.zyf.ai/mcp

# Self-hosted (your data)
http://localhost:3005/mcp
```

**For programmatic access with your own API key**, see the example above under "Pass API Key via HTTP Headers".

### Testing with MCP Inspector

You can test the server using the official MCP Inspector:

```bash
npx @modelcontextprotocol/inspector
```

Then enter the endpoint URL: `https://mcp.zyf.ai/mcp`

### Building LLM-Powered DeFi Apps with Zyfai MCP

For developers building **AI-powered DeFi agents** that can autonomously discover yield opportunities, analyze portfolios, and provide intelligent recommendations, here's how to integrate the Zyfai MCP server with your LLM application.

**Installation:**

```bash
# For Anthropic Claude
npm install @modelcontextprotocol/sdk @anthropic-ai/sdk

# For OpenAI GPT
npm install @modelcontextprotocol/sdk openai

# Or use pnpm
pnpm add @modelcontextprotocol/sdk openai
```

**Complete Example - AI DeFi Yield Optimizer:**

This example shows how to build an LLM agent that uses Zyfai MCP server to create an intelligent DeFi assistant. Choose between OpenAI or Anthropic based on your preference.

```typescript
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import OpenAI from "openai";

/**
 * Initialize Zyfai MCP Client using Streamable HTTP Transport
 */
async function initializeZyfaiMCP() {
  // Both endpoints work: /mcp (Streamable HTTP) or /sse (SSE)
  const transport = new StreamableHTTPClientTransport(
    new URL("https://mcp.zyf.ai/mcp"), // or use /sse for backward compatibility
    // Optional: Pass your own API key to access YOUR users' data
    // If omitted, uses server's default API key
    process.env.ZYFAI_API_KEY
      ? {
          headers: {
            "x-api-key": process.env.ZYFAI_API_KEY,
          },
        }
      : undefined
  );

  const client = new Client(
    {
      name: "defi-ai-agent",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  await client.connect(transport);
  console.log("Connected to Zyfai MCP Server");

  return client;
}

/**
 * DeFi AI Agent with OpenAI - Combines LLM reasoning with Zyfai MCP tools
 */
class DeFiAIAgent {
  private zyfaiClient: Client;
  private openai: OpenAI;
  private availableTools: any[];

  constructor(zyfaiClient: Client, openaiApiKey: string) {
    this.zyfaiClient = zyfaiClient;
    this.openai = new OpenAI({ apiKey: openaiApiKey });
    this.availableTools = [];
  }

  /**
   * Initialize agent by discovering available Zyfai tools
   */
  async initialize() {
    const toolsResponse = await this.zyfaiClient.listTools();

    // Convert MCP tool schema to OpenAI function calling format
    this.availableTools = toolsResponse.tools.map((tool) => ({
      type: "function",
      function: {
        name: tool.name,
        description: tool.description,
        parameters: tool.inputSchema,
      },
    }));

    console.log(
      `Agent initialized with ${this.availableTools.length} Zyfai tools`
    );
  }

  /**
   * Execute a tool call via Zyfai MCP
   */
  async executeTool(toolName: string, toolInput: any) {
    console.log(`Executing: ${toolName}`, toolInput);

    const result = await this.zyfaiClient.callTool({
      name: toolName,
      arguments: toolInput,
    });

    // Extract text content from MCP response
    const content = result.content
      .filter((item: any) => item.type === "text")
      .map((item: any) => item.text)
      .join("\n");

    return content;
  }

  /**
   * Chat with the AI agent - it can use Zyfai tools automatically
   */
  async chat(userMessage: string, conversationHistory: any[] = []) {
    const messages = [
      ...conversationHistory,
      {
        role: "user",
        content: userMessage,
      },
    ];

    let response = await this.openai.chat.completions.create({
      model: "gpt-4o", // or "gpt-4-turbo", "gpt-3.5-turbo"
      messages: messages,
      tools: this.availableTools,
      tool_choice: "auto",
    });

    let message = response.choices[0].message;
    console.log(`Response finish reason: ${response.choices[0].finish_reason}`);

    // Handle tool calls iteratively
    while (message.tool_calls && message.tool_calls.length > 0) {
      // Add assistant's response to conversation
      messages.push(message);

      // Execute each tool call
      for (const toolCall of message.tool_calls) {
        const toolName = toolCall.function.name;
        const toolArgs = JSON.parse(toolCall.function.arguments);

        // Execute the tool via Zyfai MCP
        const toolResult = await this.executeTool(toolName, toolArgs);

        // Add tool result to conversation
        messages.push({
          role: "tool",
          tool_call_id: toolCall.id,
          content: toolResult,
        });
      }

      // Get next response from OpenAI
      response = await this.openai.chat.completions.create({
        model: "gpt-4o",
        messages: messages,
        tools: this.availableTools,
        tool_choice: "auto",
      });

      message = response.choices[0].message;
      console.log(
        `Continued finish reason: ${response.choices[0].finish_reason}`
      );
    }

    // Extract final text response
    const finalResponse = message.content || "";

    return {
      response: finalResponse,
      conversationHistory: [...messages, message],
    };
  }
}

/**
 * Example Usage: AI-Powered DeFi Scenarios
 */
async function runDeFiAgent() {
  // Initialize Zyfai MCP client
  const zyfaiClient = await initializeZyfaiMCP();

  // Create AI agent with Zyfai tools (using OpenAI)
  const agent = new DeFiAIAgent(zyfaiClient, process.env.OPENAI_API_KEY!);
  await agent.initialize();

  // Scenario 1: Find best yield opportunities
  console.log("\nScenario 1: Finding best yields\n");
  const result1 = await agent.chat(
    "I have $10,000 USDC on Base chain. Find me the safest yield opportunities with at least 4% APY. Compare the top 3 options and recommend the best one considering TVL and historical performance."
  );
  console.log("Agent:", result1.response);

  // Scenario 2: Portfolio analysis with multi-chain context
  console.log("\nScenario 2: Portfolio Analysis\n");
  const result2 = await agent.chat(
    "Analyze the portfolio for wallet 0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb across Base and Arbitrum. Calculate total earnings, identify underperforming positions, and suggest rebalancing strategies.",
    result1.conversationHistory
  );
  console.log("Agent:", result2.response);

  // Scenario 3: Degen vs Safe strategy recommendation
  console.log("\nScenario 3: Risk-based Strategy\n");
  const result3 = await agent.chat(
    "I'm willing to take high risks for potentially 20%+ APY. Show me degen strategies on Base, but warn me about the risks. Also compare this with the safest alternative so I understand the trade-offs.",
    result2.conversationHistory
  );
  console.log("Agent:", result3.response);

  // Scenario 4: Historical performance tracking
  console.log("\nScenario 4: Performance Tracking\n");
  const result4 = await agent.chat(
    "For the same wallet, get the daily APY history for the last 30 days. Calculate the average APY and tell me if the performance is trending up or down. Should I consider moving funds?",
    result3.conversationHistory
  );
  console.log("Agent:", result4.response);

  // Scenario 5: Cross-chain opportunity discovery
  console.log("\nScenario 5: Cross-Chain Analysis\n");
  const result5 = await agent.chat(
    "Compare yield opportunities across Base, Arbitrum, and Plasma for stablecoin farming. Which chain currently offers the best risk-adjusted returns? Factor in gas costs and protocol safety.",
    result4.conversationHistory
  );
  console.log("Agent:", result5.response);
}

// Run examples
console.log("Starting AI DeFi Agent Examples...\n");

runDeFiAgent()
  .then(() => {
    console.log("\nAll scenarios completed!");
  })
  .catch((error) => {
    console.error("Error:", error);
  });
```

**Example Conversation:**

```
User: "I have 5000 USDC on Base. What's my best option?"

Agent: *Calls get-safe-opportunities tool*
       *Calls get-available-protocols tool*
       *Analyzes results*

Agent: "Based on current data, I recommend Aave V3 on Base:
       - APY: 4.8% (stable over 30 days)
       - TVL: $45M (high liquidity)
       - Risk: Low (audited, established protocol)
       - Expected monthly return: ~$20

       Alternative: Compound offers 4.2% APY if you prefer even
       more battle-tested protocols."

User: "How has Aave performed historically?"

Agent: *Calls get-daily-apy-history tool*
       *Calls get-apy-per-strategy tool*

Agent: "Aave on Base has shown consistent performance:
       - 30-day average APY: 4.6%
       - Lowest: 4.1%, Highest: 5.2%
       - Trend: Stable with slight upward movement
       - Active wallets: 2,847 (growing ecosystem)

       This is a solid choice for stable, predictable yields."
```

For more advanced integrations, combine with direct [@zyfai/sdk](https://sdk.zyf.ai/) integration for transaction execution

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

- `pnpm run build` - Compile TypeScript to JavaScript
- `pnpm start` - Start the production HTTP server (`build/index.js`)
- `pnpm run dev` - Build and start in development mode
- `pnpm run clean` - Clean build directory

**Note:** The project includes both:

- `index.ts` - Streamable HTTP server for web/remote access
- `index-stdio.ts` - STDIO server for Claude Desktop (local)

## Contributing

Feel free to submit issues and enhancement requests!

## License

ISC

## Related Projects

- [@zyfai/sdk](https://www.npmjs.com/package/@zyfai/sdk) - Zyfai TypeScript SDK
- [@modelcontextprotocol/sdk](https://docs.anthropic.com/en/docs/agents-and-tools/mcp) - Model Context Protocol SDK
