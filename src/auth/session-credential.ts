import { getExecutionApiBaseUrl } from "@zyfai/sdk";
import { config } from "../config/env.js";

export async function exchangeMcpSessionCredential(
  mcpAccessToken: string,
): Promise<string> {
  const secret = config.mcpServerExchangeSecret;
  if (!secret) {
    throw new Error("MCP_SERVER_EXCHANGE_SECRET is not configured");
  }
  const executionBase =
    config.executionApiUrl ??
    (config.backendEnvironment
      ? getExecutionApiBaseUrl(config.backendEnvironment)
      : "https://api.zyf.ai");
  const url = `${executionBase.replace(/\/$/, "")}/api/v1/oauth/session-credential`;
  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mcpAccessToken}`,
      "X-Mcp-Server-Key": secret,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({}),
  });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(
      `Failed to exchange MCP session credential (${response.status}): ${body}`,
    );
  }
  const json = (await response.json()) as { accessToken?: string };
  if (!json.accessToken) {
    throw new Error("Session credential response missing accessToken");
  }
  return json.accessToken;
}
