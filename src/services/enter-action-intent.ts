import type {
  AgentEnterIntentStatus,
  SupportedAsset,
  SupportedChainId,
} from "@zyfai/sdk";
import { config } from "../config/env.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

export type EnterActionIntentParams = {
  chainId: SupportedChainId;
  asset: string;
  amount: string;
  strategy?: string;
  clientLabel?: string;
  txHash?: string;
  depositId?: string;
};

const CLIENT_HOST_LABELS: { host: string; label: string }[] = [
  { host: "cursor.com", label: "Cursor" },
  { host: "cursor.sh", label: "Cursor" },
  { host: "claude.ai", label: "Claude" },
  { host: "grok.com", label: "Grok" },
  { host: "x.ai", label: "Grok" },
  { host: "chatgpt.com", label: "ChatGPT" },
  { host: "chat.openai.com", label: "ChatGPT" },
];

/** Short chat name for the signing page. Unknown clients stay unnamed. */
export function chatLabelFromClientId(clientId: string): string | undefined {
  let host = "";
  try {
    host = new URL(clientId).hostname.toLowerCase();
  } catch {
    host = "";
  }
  if (host) {
    const match = CLIENT_HOST_LABELS.find(
      (entry) => host === entry.host || host.endsWith(`.${entry.host}`),
    );
    if (match) return match.label;
  }
  const bare: Record<string, string> = {
    cursor: "Cursor",
    claude: "Claude",
    grok: "Grok",
    chatgpt: "ChatGPT",
  };
  return bare[clientId.trim().toLowerCase()];
}

export type CreatedEnterActionIntent = {
  actionId: string;
  signingTicket: string;
  signingUrl: string;
};

export function buildSigningUrl(
  signingTicket: string,
  clientLabel?: string,
): string {
  const base = config.zyfaiWebSigningBase;
  const ticket = encodeURIComponent(signingTicket);
  const url = `${base}/agent/deposit-sign?ticket=${ticket}`;
  if (!clientLabel) return url;
  return `${url}&client=${encodeURIComponent(clientLabel)}`;
}

export async function createEnterActionIntent(
  zyfiApi: ZyfaiApiService,
  intent: EnterActionIntentParams,
): Promise<CreatedEnterActionIntent> {
  const { data } = await zyfiApi.createAgentEnterIntent({
    chainId: intent.chainId,
    amount: intent.amount,
    asset: intent.asset as SupportedAsset,
    strategy: intent.strategy as
      | "conservative"
      | "aggressive"
      | "yieldmaxxing"
      | undefined,
  });
  return {
    actionId: data.actionId,
    signingTicket: data.signingTicket,
    signingUrl: buildSigningUrl(data.signingTicket, intent.clientLabel),
  };
}

export class EnterActionIntentConsumeError extends Error {
  constructor(
    message: string,
    readonly code: "invalid" | "conflict",
  ) {
    super(message);
    this.name = "EnterActionIntentConsumeError";
  }
}

export async function consumeEnterActionIntent(
  zyfiApi: ZyfaiApiService,
  actionId: string,
  expected: EnterActionIntentParams,
): Promise<AgentEnterIntentStatus> {
  if (!expected.txHash || !expected.depositId) {
    throw new EnterActionIntentConsumeError(
      "txHash and depositId are required to commit an enter intent",
      "invalid",
    );
  }
  try {
    const response = await zyfiApi.consumeAgentEnterIntent(actionId, {
      chainId: expected.chainId,
      amount: expected.amount,
      asset: expected.asset as SupportedAsset,
      txHash: expected.txHash,
      depositId: expected.depositId,
    });
    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to commit enter intent";
    if (/already completed/i.test(message)) {
      throw new EnterActionIntentConsumeError(message, "conflict");
    }
    throw new EnterActionIntentConsumeError(message, "invalid");
  }
}
