import crypto from "crypto";

export type EnterActionIntent = {
  userId: string;
  clientId: string;
  chainId: number;
  asset: string;
  amount: string;
  strategy?: string;
  expiresAt: number;
};

const intents = new Map<string, EnterActionIntent>();
const TTL_MS = 30 * 60 * 1000;

export function createEnterActionIntent(
  intent: Omit<EnterActionIntent, "expiresAt">,
): string {
  const actionId = crypto.randomBytes(12).toString("base64url");
  intents.set(actionId, {
    ...intent,
    expiresAt: Date.now() + TTL_MS,
  });
  return actionId;
}

export function consumeEnterActionIntent(
  actionId: string,
  expected: Omit<EnterActionIntent, "expiresAt" | "strategy"> & {
    strategy?: string;
  },
): EnterActionIntent | null {
  const record = intents.get(actionId);
  intents.delete(actionId);
  if (!record || record.expiresAt < Date.now()) {
    return null;
  }
  if (
    record.userId !== expected.userId ||
    record.clientId !== expected.clientId ||
    record.chainId !== expected.chainId ||
    record.asset.toUpperCase() !== expected.asset.toUpperCase() ||
    record.amount !== expected.amount
  ) {
    return null;
  }
  return record;
}

export function pruneExpiredIntents(): void {
  const now = Date.now();
  for (const [id, record] of intents) {
    if (record.expiresAt < now) {
      intents.delete(id);
    }
  }
}
