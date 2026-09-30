import { applyIntegrationServerEnv } from "./utils.js";

applyIntegrationServerEnv();

if (
  process.env.PORT?.trim() &&
  process.env.MCP_RESOURCE_URL?.trim() &&
  !process.env.ZYFAI_ENV?.trim()
) {
  console.warn(
    "[integration] zyfai-mcp-server/.env.test looks like a copy of .env (PORT, MCP_*). " +
      "Use env.test.example instead: ZYFAI_ENV plus LOCAL_/STAGING_/PRODUCTION_ZYFAI_API_KEY. " +
      "Vitest merges ../zyfai-sdk/.env.test for missing vars.",
  );
}
