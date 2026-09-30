/** Optional MCP Apps HTML resources (JSON tools remain canonical). */
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const portfolioHtml = `<!DOCTYPE html><html><body><p>Zyfai portfolio summary renders from tool JSON.</p></body></html>`;

export function registerMcpAppResources(server: McpServer): void {
  server.registerResource(
    "portfolio-app",
    "ui://zyfai/portfolio-summary",
    {
      title: "Portfolio summary",
      description: "Companion view for get_portfolio structured content",
      mimeType: "text/html;profile=mcp-app",
    },
    async () => ({
      contents: [
        {
          uri: "ui://zyfai/portfolio-summary",
          mimeType: "text/html;profile=mcp-app",
          text: portfolioHtml,
        },
      ],
    }),
  );
}
