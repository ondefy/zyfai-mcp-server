/**
 * User Flow Helper Tools
 */

import { z } from "zod";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ZyfaiApiService } from "../services/zyfai-api.service.js";

export function registerHelperTools(
  server: McpServer,
  zyfiApi: ZyfaiApiService
) {
  server.tool(
    "get-user-details",
    "Get current authenticated user details including smart wallet, chains, protocols, etc. (Requires authentication)",
    {},
    async () => {
      try {
        const response = await zyfiApi.getUserDetails();
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
              text: `Error fetching user details: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          isError: true,
        };
      }
    }
  );
}
