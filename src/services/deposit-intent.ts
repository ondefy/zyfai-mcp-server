import type { SupportedAsset, SupportedChainId } from "@zyfai/sdk";
import { config } from "../config/env.js";
import type { ZyfaiApiService } from "./zyfai-api.service.js";

export type DepositIntentParams = {
  chainId: SupportedChainId;
  asset: string;
  amount: string;
  clientLabel?: string;
  txHash?: string;
  depositId?: string;
};

export type DepositIntentStatusSnapshot = {
  chainId?: number;
  asset?: string;
  amount?: string;
  status: string;
};

/** Returns an error message when the intent cannot accept this deposit registration. */
export function depositIntentRegistrationMismatch(
  intent: DepositIntentStatusSnapshot,
  chainId: number,
  asset: string,
  amount: string,
): string | null {
  if (intent.status === "expired") {
    return "Deposit intent expired";
  }
  if (intent.status !== "pending" && intent.status !== "completed") {
    return "Invalid deposit intent status";
  }
  if (intent.chainId !== chainId) {
    return "Deposit intent chainId does not match";
  }
  if (intent.asset?.toUpperCase() !== asset.toUpperCase()) {
    return "Deposit intent asset does not match";
  }
  if (intent.amount !== amount) {
    return "Deposit intent amount does not match";
  }
  return null;
}

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

export type CreatedDepositIntent = {
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

export async function createDepositIntent(
  zyfiApi: ZyfaiApiService,
  intent: DepositIntentParams,
): Promise<CreatedDepositIntent> {
  const { data } = await zyfiApi.createAgentDepositIntent({
    chainId: intent.chainId,
    amount: intent.amount,
    asset: intent.asset as SupportedAsset,
  });
  return {
    actionId: data.actionId,
    signingTicket: data.signingTicket,
    signingUrl: buildSigningUrl(data.signingTicket, intent.clientLabel),
  };
}

export class DepositIntentConsumeError extends Error {
  constructor(
    message: string,
    readonly code: "invalid" | "conflict",
  ) {
    super(message);
    this.name = "DepositIntentConsumeError";
  }
}

export async function consumeDepositIntent(
  zyfiApi: ZyfaiApiService,
  actionId: string,
  expected: DepositIntentParams,
): Promise<
  Awaited<ReturnType<ZyfaiApiService["consumeAgentDepositIntent"]>>["data"]
> {
  if (!expected.txHash || !expected.depositId) {
    throw new DepositIntentConsumeError(
      "txHash and depositId are required to commit a deposit intent",
      "invalid",
    );
  }
  try {
    const response = await zyfiApi.consumeAgentDepositIntent(actionId, {
      chainId: expected.chainId,
      amount: expected.amount,
      asset: expected.asset as SupportedAsset,
      txHash: expected.txHash,
      depositId: expected.depositId,
    });
    return response.data;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Failed to commit deposit intent";
    if (/already completed/i.test(message)) {
      throw new DepositIntentConsumeError(message, "conflict");
    }
    throw new DepositIntentConsumeError(message, "invalid");
  }
}
