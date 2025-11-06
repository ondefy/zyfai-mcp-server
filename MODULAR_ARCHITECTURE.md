# Modular Architecture 🏗️

This document describes the new modular architecture of the ZyFAI Rebalancing MCP Server.

## Project Structure

```
mcp-server-template/
├── index.ts                              # Main entry point (now < 100 lines!)
├── src/
│   ├── config/
│   │   └── env.ts                        # Environment configuration
│   ├── services/
│   │   └── zyfai-api.service.ts          # ZyFAI API client wrapper
│   ├── types/
│   │   └── zyfai-api.types.ts            # TypeScript type definitions
│   ├── tools/
│   │   ├── index.ts                      # Tools registration hub
│   │   ├── portfolio.tools.ts            # Portfolio management tools (2)
│   │   ├── opportunities.tools.ts        # Opportunities discovery tools (4)
│   │   ├── rebalancing.tools.ts          # Rebalancing tools (5)
│   │   ├── analytics.tools.ts            # Analytics & metrics tools (3)
│   │   ├── historical.tools.ts           # Historical data tools (2)
│   │   └── helpers.tools.ts              # User flow helper tools (2)
│   ├── routes/
│   │   └── http.routes.ts                # Express HTTP route handlers
│   └── middleware/
│       └── index.ts                      # Express middleware
├── package.json
├── tsconfig.json
├── ecosystem.config.cjs                  # PM2 configuration
└── build/                                # Compiled JavaScript output

```

## Architecture Overview

### 1. Main Entry Point (`index.ts`)

The main file is now **slim and focused** (~100 lines vs 919 lines before):

- Initializes services
- Sets up Express app
- Creates MCP server
- Registers all tools via a single function call
- Sets up routes
- Handles graceful shutdown

### 2. Configuration (`src/config/`)

**`env.ts`**: Centralized environment variable management
- Server configuration (port, host)
- CORS settings
- ZyFAI API configuration

### 3. Tools (`src/tools/`)

Each tool category is in its own file:

**`portfolio.tools.ts`** (2 tools):
- `get-portfolio`
- `get-multichain-portfolio`

**`opportunities.tools.ts`** (4 tools):
- `get-top-opportunities`
- `get-safe-opportunities`
- `get-degen-opportunities`
- `get-degen-acp-opportunities`

**`rebalancing.tools.ts`** (5 tools):
- `get-rebalance-recommendations`
- `get-same-chain-rebalance-recommendations`
- `get-cross-chain-rebalance-recommendations`
- `backtest-same-chain-rebalance`
- `backtest-cross-chain-rebalance`

**`analytics.tools.ts`** (3 tools):
- `get-best-positions`
- `get-risk-metrics`
- `get-user-earnings`

**`historical.tools.ts`** (2 tools):
- `get-protocol-apy-history`
- `get-morpho-average-apys`

**`helpers.tools.ts`** (2 tools):
- `complete-user-onboarding-flow`
- `get-position-summary`

**`index.ts`**: Central registration hub
- Exports `registerAllTools()` function
- Simplifies tool registration in main file

### 4. Routes (`src/routes/`)

**`http.routes.ts`**: Express route handlers
- Health check endpoint
- Root endpoint
- SSE endpoint for MCP communication
- Message POST endpoint

### 5. Middleware (`src/middleware/`)

**`index.ts`**: Express middleware
- `requestLogger()`: Logs incoming requests
- `errorHandler()`: Global error handler
- `notFoundHandler()`: 404 handler

### 6. Services (`src/services/`)

**`zyfai-api.service.ts`**: ZyFAI API client wrapper
- Axios-based HTTP client
- Request/response interceptors
- Type-safe API methods
- Error handling

### 7. Types (`src/types/`)

**`zyfai-api.types.ts`**: TypeScript type definitions
- API response interfaces
- Type safety across the codebase

## Benefits of Modular Architecture

### 1. **Maintainability**
- Each file has a single responsibility
- Easy to locate and modify specific features
- Reduced cognitive load when reading code

### 2. **Scalability**
- Easy to add new tools in their respective category files
- New categories can be added without touching existing code
- Simple to extend functionality

### 3. **Testability**
- Individual modules can be unit tested in isolation
- Mock dependencies easily
- Better test coverage

### 4. **Collaboration**
- Multiple developers can work on different modules simultaneously
- Reduced merge conflicts
- Clear code ownership

### 5. **Code Reusability**
- Services and utilities can be shared across modules
- Consistent patterns across the codebase

### 6. **Performance**
- Tree-shaking friendly
- Lazy loading potential
- Smaller bundle sizes

## How to Add New Tools

### Step 1: Choose the Right Category

Determine which category your tool belongs to:
- Portfolio Management
- Opportunities Discovery
- Rebalancing
- Analytics & Metrics
- Historical Data
- User Flow Helpers

### Step 2: Add Tool to Category File

Edit the appropriate `*.tools.ts` file in `src/tools/`:

```typescript
server.tool(
  "your-tool-name",
  "Your tool description",
  {
    // Zod schema for parameters
    param: z.string().describe("Parameter description"),
  },
  async ({ param }) => {
    try {
      const response = await zyfiApi.yourMethod(param);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(response, null, 2),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: `Error: ${error instanceof Error ? error.message : "Unknown error"}`,
          },
        ],
        isError: true,
      };
    }
  }
);
```

### Step 3: Add API Method (if needed)

If your tool needs a new API endpoint, add it to `src/services/zyfai-api.service.ts`:

```typescript
async yourMethod(param: string): Promise<ApiResponse<YourType>> {
  try {
    const response = await this.client.get<YourType>("/your/endpoint", {
      params: { param },
    });
    return {
      success: true,
      data: response.data,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    throw this.handleError(error);
  }
}
```

### Step 4: Add Types (if needed)

Add new interfaces to `src/types/zyfai-api.types.ts`:

```typescript
export interface YourType {
  field1: string;
  field2: number;
}
```

### Step 5: Update Health Check

Update the tool counts in:
- `src/routes/http.routes.ts` (health endpoint)
- `index.ts` (startup logs)

### Step 6: Rebuild and Test

```bash
pnpm run build
pnpm start
curl http://localhost:3005/health
```

## How to Add a New Category

If you need to add an entirely new category:

### 1. Create New Tool File

```bash
touch src/tools/your-category.tools.ts
```

### 2. Implement Registration Function

```typescript
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyFAIApiService } from "../services/zyfai-api.service.js";

export function registerYourCategoryTools(
  server: McpServer,
  zyfiApi: ZyFAIApiService
) {
  // Add your tools here
}
```

### 3. Register in Hub

Edit `src/tools/index.ts`:

```typescript
import { registerYourCategoryTools } from "./your-category.tools.js";

export function registerAllTools(server: McpServer, zyfiApi: ZyFAIApiService) {
  // ... existing registrations
  registerYourCategoryTools(server, zyfiApi);
}
```

## Migration from Monolithic

The previous `index.ts` was 919 lines. Now it's **~100 lines**:

**Before:**
- All tools defined in one file
- Routes mixed with tool definitions
- Middleware scattered throughout
- Hard to navigate and maintain

**After:**
- Clean separation of concerns
- Each module has a single responsibility
- Easy to find and modify code
- Follows best practices for Node.js/TypeScript projects

## Development Workflow

### Local Development

```bash
# Install dependencies
pnpm install

# Build
pnpm run build

# Start server
pnpm start

# Or: Build and start in one command
pnpm run dev
```

### Production Deployment

```bash
# Build
pnpm run build

# Start with PM2
pm2 start ecosystem.config.cjs

# Monitor
pm2 logs zyfai-mcp-server
pm2 monit
```

## Code Style & Best Practices

### 1. Functional Programming
- Use functional and declarative patterns
- Avoid classes (except service classes)
- Favor composition over inheritance

### 2. TypeScript
- Use strict type checking
- Leverage Zod for runtime validation
- Define interfaces for all API responses

### 3. Error Handling
- Always use try-catch in async functions
- Return structured error responses
- Log errors appropriately

### 4. Naming Conventions
- Use descriptive names with auxiliary verbs (`isLoading`, `hasError`)
- Tool names use kebab-case (`get-portfolio`)
- File names use kebab-case (`portfolio.tools.ts`)
- Function names use camelCase (`registerPortfolioTools`)

### 5. Comments
- Add JSDoc comments for exported functions
- Explain "why" not "what"
- Keep comments up-to-date

## Testing Strategy

### Unit Tests
Test individual modules in isolation:
- Tool registration functions
- API service methods
- Middleware functions

### Integration Tests
Test interactions between modules:
- Tool execution end-to-end
- API client with mock server
- HTTP routes with Express

### E2E Tests
Test the entire system:
- MCP client communication
- Real API calls (in staging)
- Production-like scenarios

## Performance Considerations

### 1. Lazy Loading
- Tools are only registered when server starts
- API client is singleton
- Routes are defined once

### 2. Caching
- Consider adding caching layer for frequently accessed data
- Cache configuration in environment

### 3. Connection Pooling
- Axios automatically manages HTTP connections
- Configure timeout appropriately

### 4. Error Recovery
- Graceful degradation when APIs fail
- Retry logic for transient errors

## Security Best Practices

### 1. Environment Variables
- Never commit `.env` files
- Use environment-specific configurations
- Validate environment variables on startup

### 2. CORS
- Configure allowed origins properly
- Don't use `*` in production

### 3. Input Validation
- Use Zod schemas for all inputs
- Sanitize user inputs
- Validate API responses

### 4. Error Messages
- Don't expose sensitive information in errors
- Log detailed errors server-side
- Return generic errors to clients

## Monitoring & Observability

### Logs
- Request/response logs
- Error logs
- Performance metrics

### Health Checks
- `/health` endpoint returns service status
- Tool counts for verification
- Timestamp for uptime tracking

### Metrics (Future)
- Request rate
- Error rate
- Response time
- Tool usage statistics

## Future Enhancements

1. **Rate Limiting**: Add rate limiting middleware
2. **Authentication**: Add API key authentication
3. **Caching**: Implement Redis caching layer
4. **Metrics**: Add Prometheus metrics
5. **Logging**: Integrate structured logging (Winston/Pino)
6. **Testing**: Add comprehensive test suite
7. **Documentation**: Auto-generate API docs from tools
8. **CLI**: Add CLI tool for local testing

## Contributing

When contributing to this project:

1. Follow the modular architecture
2. Add new tools to appropriate category files
3. Update documentation
4. Add tests for new functionality
5. Update tool counts in health endpoint
6. Follow TypeScript and ESLint rules
7. Write descriptive commit messages

## License

MIT
