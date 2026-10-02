# MCP Apps

When `MCP_APPS_ENABLED=true`, the server registers companion HTML resources (for example `ui://zyfai/portfolio-summary`) via [`src/tools/mcp-apps.resources.ts`](../src/tools/mcp-apps.resources.ts).

Tools always return full JSON (`structuredContent` + text summary). Widgets are optional; hosts without MCP Apps support ignore the resources.

Enable locally:

```bash
MCP_APPS_ENABLED=true pnpm run dev
```

Future: expand comparison and action-status views using `@modelcontextprotocol/ext-apps` bundles.
