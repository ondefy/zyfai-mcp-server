import { describe } from "vitest";
import type { Server } from "node:http";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import {
  type BackendEnvironment,
  getDataApiBaseUrl,
  getExecutionApiBaseUrl,
} from "@zyfai/sdk";

const INTEGRATION_ENV_PREFIX: Record<BackendEnvironment, string> = {
  local: "LOCAL",
  staging: "STAGING",
  production: "PRODUCTION",
};

function parseIntegrationEnvironment(raw: string | undefined): BackendEnvironment {
  const value = (raw ?? "local").trim().toLowerCase();
  switch (value) {
    case "local":
      return "local";
    case "staging":
    case "stage":
      return "staging";
    case "production":
    case "prod":
      return "production";
    default:
      throw new Error(
        `Invalid ZYFAI_ENV="${raw}" — use local, staging, or production`,
      );
  }
}

/** Backend stack for integration tests (`ZYFAI_ENV`, default `local`). */
export function integrationEnvironment(): BackendEnvironment {
  return parseIntegrationEnvironment(process.env.ZYFAI_ENV);
}

export function integrationEnvPrefix(): string {
  return INTEGRATION_ENV_PREFIX[integrationEnvironment()];
}

export function integrationApiKeyVarName(env?: BackendEnvironment): string {
  const target = env ?? integrationEnvironment();
  return `${INTEGRATION_ENV_PREFIX[target]}_ZYFAI_API_KEY`;
}

export function readIntegrationApiKey(env?: BackendEnvironment): string | undefined {
  const target = env ?? integrationEnvironment();
  const prefixed = process.env[integrationApiKeyVarName(target)]?.trim();
  if (prefixed) {
    return prefixed;
  }
  return process.env.ZYFAI_API_KEY?.trim();
}

export function integrationApiUrls(): {
  executionApiUrl: string;
  dataApiUrl: string;
} {
  const env = integrationEnvironment();
  return {
    executionApiUrl: getExecutionApiBaseUrl(env),
    dataApiUrl: getDataApiBaseUrl(env),
  };
}

const DEFAULT_LOCAL_DATA_API_URL = "https://staging-defiapi.zyf.ai";

/**
 * Called from `setup.ts` and again before in-process server startup.
 */
export function applyIntegrationServerEnv(): void {
  const env = integrationEnvironment();
  process.env.ZYFAI_BACKEND_ENV = env;

  const apiKey = readIntegrationApiKey();
  if (apiKey) {
    process.env.ZYFAI_API_KEY = apiKey;
  }

  if (!process.env.ZYFAI_EXECUTION_API_URL?.trim()) {
    process.env.ZYFAI_EXECUTION_API_URL = integrationApiUrls().executionApiUrl;
  }
  if (!process.env.ZYFAI_DATA_API_URL?.trim()) {
    process.env.ZYFAI_DATA_API_URL =
      env === "local"
        ? DEFAULT_LOCAL_DATA_API_URL
        : integrationApiUrls().dataApiUrl;
  }

  process.env.MCP_AUTH_REQUIRED = "false";
}

export type IntegrationSpendProfile = "readonly" | "spends_funds";

export type IntegrationCredentialGate = "partner_key" | "persistent_wallet";

const PRODUCTION_SPEND_SKIP_REASON =
  "production integration tests must be readonly — this suite spends real funds (use ZYFAI_ENV=staging)";

const PRIVATE_KEY_RE = /^0x[a-fA-F0-9]{64}$/;

export function skipPartnerKeyReason(): string | undefined {
  if (!readIntegrationApiKey()) {
    return `missing ${integrationApiKeyVarName()} (or ZYFAI_API_KEY) — copy env.test.example to .env.test or reuse zyfai-sdk/.env.test`;
  }
  return undefined;
}

export function skipPersistentWalletReason(): string | undefined {
  const partnerReason = skipPartnerKeyReason();
  if (partnerReason) {
    return partnerReason;
  }
  const privateKey = process.env.PRIVATE_KEY?.trim();
  if (!privateKey) {
    return "missing PRIVATE_KEY — copy env.test.example to .env.test";
  }
  if (!PRIVATE_KEY_RE.test(privateKey)) {
    return "PRIVATE_KEY must be a 32-byte hex string (0x...) in .env.test";
  }
  return undefined;
}

export function skipIntegrationSuiteReason(
  profile: IntegrationSpendProfile,
  credentialReason: string | undefined,
): string | undefined {
  if (credentialReason) {
    return credentialReason;
  }
  if (profile === "spends_funds" && integrationEnvironment() === "production") {
    return PRODUCTION_SPEND_SKIP_REASON;
  }
  return undefined;
}

export function warnIfIntegrationSkipped(
  reason: string | undefined,
  suiteId: string,
): void {
  if (reason) {
    console.warn(`[integration] skip ${suiteId}: ${reason}`);
  }
}

export type IntegrationSuiteOptions = {
  spendProfile: IntegrationSpendProfile;
  /** `partner_key` — public read tools (default). `persistent_wallet` — future OAuth/agent flows. */
  credentialGate?: IntegrationCredentialGate;
  timeout?: number;
};

export function describeIntegrationSuite(
  suiteId: string,
  options: IntegrationSuiteOptions,
  defineTests: () => void,
): void {
  const gate = options.credentialGate ?? "partner_key";
  const credentialReason =
    gate === "persistent_wallet"
      ? skipPersistentWalletReason()
      : skipPartnerKeyReason();

  const skipReason = skipIntegrationSuiteReason(
    options.spendProfile,
    credentialReason,
  );
  warnIfIntegrationSkipped(skipReason, suiteId);

  const runner = describe.skipIf(skipReason !== undefined);
  if (options.timeout !== undefined) {
    runner(suiteId, { timeout: options.timeout }, defineTests);
  } else {
    runner(suiteId, defineTests);
  }
}

export type IntegrationMcpServer = {
  baseUrl: string;
  close: () => Promise<void>;
};

/**
 * Starts an in-process MCP server on a random port, or uses `MCP_INTEGRATION_BASE_URL`
 * when testing against an already-running instance (e.g. `pnpm dev:watch`).
 */
export async function assertIntegrationExecutionApiReachable(): Promise<void> {
  if (integrationEnvironment() !== "local") {
    return;
  }
  const { executionApiUrl } = integrationApiUrls();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 2500);
  try {
    await fetch(executionApiUrl, { signal: controller.signal });
  } catch {
    throw new Error(
      `ZYFAI_ENV=local targets ${executionApiUrl} but nothing is reachable. ` +
        "Start zyfai-api from workspace root: pnpm dev:zyfai-api (or pnpm dev:mcp). " +
        "Or use staging: ZYFAI_ENV=staging pnpm run test:integration",
    );
  } finally {
    clearTimeout(timer);
  }
}

export async function startIntegrationMcpServer(): Promise<IntegrationMcpServer> {
  const external = process.env.MCP_INTEGRATION_BASE_URL?.trim();
  if (external) {
    return {
      baseUrl: external.replace(/\/$/, ""),
      close: async () => {},
    };
  }

  applyIntegrationServerEnv();
  const { createApp } = await import("../create-app.js");
  const { app } = createApp();

  const httpServer = await new Promise<Server>((resolve, reject) => {
    const server = app.listen(0, "127.0.0.1", () => resolve(server));
    server.on("error", reject);
  });

  const address = httpServer.address();
  if (!address || typeof address === "string") {
    throw new Error("Failed to bind integration MCP server");
  }

  return {
    baseUrl: `http://127.0.0.1:${address.port}`,
    close: () =>
      new Promise((resolve, reject) => {
        httpServer.close((error) => (error ? reject(error) : resolve()));
      }),
  };
}

export async function connectIntegrationMcpClient(
  baseUrl: string,
): Promise<Client> {
  const client = new Client(
    { name: "zyfai-mcp-integration", version: "0.0.0" },
    { capabilities: {} },
  );
  const transport = new StreamableHTTPClientTransport(
    new URL(`${baseUrl.replace(/\/$/, "")}/mcp`),
  );
  await client.connect(transport);
  return client;
}

export function parseMcpToolJson<T = unknown>(
  result: Awaited<ReturnType<Client["callTool"]>>,
): T {
  if (result.isError) {
    const content = result.content as Array<{ type: string; text?: string }>;
    const message =
      content?.[0]?.type === "text" && content[0].text
        ? content[0].text
        : "MCP tool returned isError";
    throw new Error(message);
  }
  const content = result.content as Array<{ type: string; text?: string }>;
  const block = content?.[0];
  if (!block || block.type !== "text" || !block.text) {
    throw new Error("Expected text content from MCP tool");
  }
  return JSON.parse(block.text) as T;
}

export function logIntegrationEvidence(
  suiteId: string,
  payload: Record<string, unknown>,
): void {
  console.log(
    JSON.stringify({
      evidence: suiteId,
      environment: integrationEnvironment(),
      mcpBaseUrl:
        process.env.MCP_INTEGRATION_BASE_URL?.trim() ?? "in-process",
      ...payload,
      links: {
        executionApi: integrationApiUrls().executionApiUrl,
        dataApi: integrationApiUrls().dataApiUrl,
      },
    }),
  );
}
