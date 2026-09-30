import { expect, it } from "vitest";
import {
  describeIntegrationSuite,
  logIntegrationEvidence,
  startIntegrationMcpServer,
} from "./utils.js";

describeIntegrationSuite("health", { spendProfile: "readonly" }, () => {
  it("returns healthy from /health", async () => {
    const { baseUrl, close } = await startIntegrationMcpServer();
    try {
      const response = await fetch(`${baseUrl}/health`);
      expect(response.status).toBe(200);
      const body = (await response.json()) as { status?: string };
      expect(body.status).toBe("healthy");

      logIntegrationEvidence("health", { baseUrl });
    } finally {
      await close();
    }
  });
});
