/**
 * Sentences the model is allowed to say. A recommendation names only the
 * pools a simulation actually chose.
 */

import { formatUnits, parseUnits } from "viem";
import {
  internalStrategyToPublicTier,
  type PublicStrategyTier,
} from "../config/strategies.js";

const CHAIN_NAMES: Record<number, string> = {
  1: "Ethereum",
  8453: "Base",
  42161: "Arbitrum",
};

const ASSET_DECIMALS: Record<string, number> = {
  USDC: 6,
  EURC: 6,
  WETH: 18,
  ETH: 18,
  NVDAc: 8,
};

export type SpokenStrategy = PublicStrategyTier;

export function chainName(chainId: number): string {
  return CHAIN_NAMES[chainId] ?? `chain ${chainId}`;
}

export function humanAmountToLeastUnits(amount: string, asset: string): string {
  const trimmed = amount.trim();
  if (!/^\d+(\.\d+)?$/.test(trimmed)) {
    throw new Error("Amount must be a number like 10");
  }
  const decimals = ASSET_DECIMALS[asset];
  if (decimals === undefined) {
    throw new Error(`Unsupported asset ${asset}`);
  }
  return parseUnits(trimmed, decimals).toString();
}

/** Symbol whose decimals scale `amount`. A preswap uses the spent token. */
export function amountAsset(asset: string, spendToken?: string): string {
  const spend = spendToken?.trim();
  if (spend && ASSET_DECIMALS[spend] !== undefined) return spend;
  return asset;
}

export function formatApy(value: number): string {
  const percent = value > 0 && value < 1 ? value * 100 : value;
  const text = percent.toFixed(2).replace(/\.?0+$/, "");
  return `${text}%`;
}

function trimAmount(value: number): string {
  if (!Number.isFinite(value)) return "";
  const digits = Math.abs(value) >= 1 || value === 0 ? 2 : 6;
  return value.toFixed(digits).replace(/\.?0+$/, "");
}

export interface ChosenPosition {
  protocol?: string;
  pool?: string;
  simulated_apy?: number;
  combined_apy?: number;
  amount?: number;
  chainId?: number;
}

export function poolLabel(position: ChosenPosition): string {
  const pool = position.pool?.trim() ?? "";
  const protocol = position.protocol?.trim() ?? "";
  if (!pool) return protocol || "a pool";
  if (!protocol || pool.toLowerCase().includes(protocol.toLowerCase())) {
    return pool;
  }
  if (pool.length <= 6) return `${protocol} ${pool}`;
  return pool;
}

export function speakSimulation(
  response: { data?: Record<string, ChosenPosition[]> },
  amount: number,
  asset: string,
): string {
  const chosen: ChosenPosition[] = [];
  for (const [chainId, rows] of Object.entries(response.data ?? {})) {
    for (const row of rows ?? []) {
      chosen.push({ ...row, chainId: Number(chainId) });
    }
  }
  if (chosen.length === 0) {
    return "Nothing is available for that amount right now.";
  }
  const sameChain = chosen.every((row) => row.chainId === chosen[0]?.chainId);
  const chain =
    sameChain && chosen[0]?.chainId !== undefined
      ? ` on ${chainName(chosen[0].chainId)}`
      : "";
  const parts = chosen.map((row) => {
    const apy = row.simulated_apy ?? row.combined_apy;
    const rate = apy !== undefined ? ` at ${formatApy(apy)}` : "";
    const where =
      !sameChain && row.chainId !== undefined
        ? ` on ${chainName(row.chainId)}`
        : "";
    return `${poolLabel(row)}${rate}${where}`;
  });
  const joined =
    parts.length === 1
      ? parts[0]
      : `${parts.slice(0, -1).join(", ")} and ${parts[parts.length - 1]}`;
  return `${trimAmount(amount)} ${asset}${chain} would go to ${joined}.`;
}

export function speakCompare(conservative: string, balanced: string): string {
  return `Conservative: ${conservative} Balanced: ${balanced}`;
}

interface PortfolioPosition {
  protocol_name?: string;
  pool?: string;
  token_symbol?: string;
  decimals?: number;
  underlyingAmount?: string;
  amount?: string;
  pool_apy?: number;
}

interface IdleBalance {
  chainId?: number;
  tokenSymbol?: string;
  balance?: string;
}

function humanFromRaw(
  raw: string | undefined,
  decimals: number | undefined,
  symbol?: string,
): string | undefined {
  if (!raw) return undefined;
  const places = decimals ?? (symbol ? ASSET_DECIMALS[symbol] : undefined);
  try {
    if (raw.startsWith("0x") && places !== undefined) {
      return trimAmount(Number(formatUnits(BigInt(raw), places)));
    }
    if (raw.includes(".")) return trimAmount(Number(raw));
    if (/^\d+$/.test(raw) && places !== undefined) {
      return trimAmount(Number(formatUnits(BigInt(raw), places)));
    }
  } catch {
    return undefined;
  }
  return undefined;
}

export function portfolioBody(response: unknown): {
  positions?: PortfolioPosition[];
  staleBalances?: IdleBalance[];
} {
  if (!response || typeof response !== "object") return {};
  const root = response as {
    portfolio?: { positions?: PortfolioPosition[]; staleBalances?: IdleBalance[] };
    positions?: PortfolioPosition[];
    staleBalances?: IdleBalance[];
  };
  if (root.portfolio && typeof root.portfolio === "object") return root.portfolio;
  return root;
}

export function speakPortfolio(portfolio: {
  positions?: PortfolioPosition[];
  staleBalances?: IdleBalance[];
}): string {
  const held = (portfolio.positions ?? []).flatMap((position) => {
    const symbol = position.token_symbol ?? "";
    const amount = humanFromRaw(
      position.underlyingAmount ?? position.amount,
      position.decimals,
      symbol,
    );
    const apy =
      position.pool_apy !== undefined ? ` at ${formatApy(position.pool_apy)}` : "";
    const name = poolLabel({
      protocol: position.protocol_name,
      pool: position.pool,
    });
    if (!name) return [];
    const qty = amount ? `${amount} ` : "";
    const asset = symbol ? `${symbol} ` : "";
    return [`${qty}${asset}are in ${name}${apy}`.replace(/\s+/g, " ").trim()];
  });
  const idle = (portfolio.staleBalances ?? []).flatMap((row) => {
    if (!row.balance || !row.tokenSymbol) return [];
    const amount = humanFromRaw(row.balance, undefined, row.tokenSymbol);
    if (!amount || amount === "0") return [];
    const chain =
      row.chainId !== undefined ? ` on ${chainName(row.chainId)}` : "";
    return [`${amount} ${row.tokenSymbol} are idle${chain}`];
  });
  const lines = [...held, ...idle];
  if (lines.length === 0) return "No funds deposited yet.";
  return `${lines.join(". ")}.`;
}

export function speakAccount(details: { chains?: number[] }): string {
  const names = (details.chains ?? []).map((chainId) => chainName(chainId));
  if (names.length === 0) return "Your account is ready.";
  return `You can deposit on ${names.join(", ")}.`;
}

export function speakDeposit(input: {
  amount: string;
  asset: string;
  chainId: number;
  signingUrl: string;
}): string {
  return `${input.amount} ${input.asset} on ${chainName(input.chainId)}. [Sign the deposit](${input.signingUrl})`;
}

export function speakDepositLanded(response: unknown): string {
  const spoken = speakPortfolio(portfolioBody(response));
  if (spoken === "No funds deposited yet.") return "The deposit is in.";
  return spoken;
}

export function strategyFromSettings(
  settings: unknown,
): SpokenStrategy | undefined {
  if (!settings || typeof settings !== "object") return undefined;
  const root = settings as {
    data?: unknown;
    assetTypeSettings?: Record<
      string,
      { rebalanceStrategy?: string; strategy?: string }
    >;
    USDC?: { rebalanceStrategy?: string; strategy?: string };
    usdc?: { rebalanceStrategy?: string; strategy?: string };
  };
  const nested = root.data;
  const bag =
    (nested && typeof nested === "object"
      ? ((nested as { assetTypeSettings?: typeof root.assetTypeSettings })
          .assetTypeSettings ?? (nested as typeof root))
      : undefined) ??
    root.assetTypeSettings ??
    root;
  const record = bag as {
    USDC?: { rebalanceStrategy?: string; strategy?: string };
    usdc?: { rebalanceStrategy?: string; strategy?: string };
  };
  const usdc = record.USDC ?? record.usdc;
  const raw = String(usdc?.rebalanceStrategy ?? usdc?.strategy ?? "");
  return internalStrategyToPublicTier(raw);
}
