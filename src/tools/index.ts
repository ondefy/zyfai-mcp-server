/**
 * MCP Tools Registration
 * Central export for all tool modules
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";
import { registerProtocolTools } from "./protocol.tools.js";
import { registerUserDataTools } from "./user-data.tools.js";
import { registerEarningsTools } from "./earnings.tools.js";
import { registerAgentTools } from "./agent.tools.js";
import { registerAgentWriteTools } from "./agent-write.tools.js";
import { config } from "../config/env.js";

/**
 * Register the tool surface.
 * Public discovery and authenticated reads are always listed. Calling a
 * protected tool without a session returns HTTP 401 plus WWW-Authenticate
 * (see authorizeMcpToolCall). The TypeScript MCP SDK has no per-tool OAuth
 * scheme, so the challenge is on the HTTP tools/call, not a tool error string.
 * Writes register only when MCP_WRITE_TOOLS_ENABLED is set.
 */
export function registerAllTools(server: McpServer, zyfiApi: ZyfaiApiService) {
  registerAgentTools(server, zyfiApi);
  if (config.mcpWriteToolsEnabled) {
    registerAgentWriteTools(server, zyfiApi);
  }
  if (config.mcpRegisterLegacyProtocolTools) {
    registerProtocolTools(server, zyfiApi);
  }
  registerUserDataTools(server, zyfiApi);
  registerEarningsTools(server, zyfiApi);
}
