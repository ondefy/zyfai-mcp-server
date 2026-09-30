import { expect, it } from "vitest";
import {
  assertIntegrationExecutionApiReachable,
  connectIntegrationMcpClient,
  describeIntegrationSuite,
  logIntegrationEvidence,
  parseMcpToolJson,
  startIntegrationMcpServer,
} from "./utils.js";

/**
 * Mirrors SDK `get-protocols` — public read through Streamable HTTP MCP.
 * Opt-in: copy `env.test.example` to `.env.test` (or reuse `zyfai-sdk/.env.test`).
 */
describeIntegrationSuite(
  "get-available-protocols",
  { spendProfile: "readonly" },
  () => {
    it("returns protocols for Base via MCP tool", async () => {
      await assertIntegrationExecutionApiReachable();
      const { baseUrl, close } = await startIntegrationMcpServer();
      const client = await connectIntegrationMcpClient(baseUrl);
      try {
        const result = await client.callTool({
          name: "get-available-protocols",
          arguments: { chainId: 8453 },
        });

        const parsed = parseMcpToolJson<{
          success: boolean;
          chainId: number;
          protocols: unknown[];
        }>(result);

        expect(parsed.success).toBe(true);
        expect(parsed.chainId).toBe(8453);
        expect(Array.isArray(parsed.protocols)).toBe(true);

        logIntegrationEvidence("get-available-protocols", {
          chainId: 8453,
          protocolCount: parsed.protocols.length,
          baseUrl,
        });
      } finally {
        await client.close();
        await close();
      }
    });
  },
);
