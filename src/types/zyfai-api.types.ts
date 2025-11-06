/**
 * ZyFAI DeFi API Types
 * Type definitions for the ZyFAI DeFi API responses
 */

// Portfolio Types
export interface PortfolioPosition {
  protocol: string;
  chain: string;
  asset: string;
  amount: string;
  value: number;
  apy: number;
}

export interface PortfolioSummary {
  totalValue: number;
  positions: PortfolioPosition[];
  chains: string[];
}

// Opportunities Types
export interface Opportunity {
  protocol: string;
  chain: string;
  asset: string;
  apy: number;
  tvl: number;
  risk: "low" | "medium" | "high";
  category: "lending" | "staking" | "liquidity" | "vault";
}

export interface OpportunitiesResponse {
  opportunities: Opportunity[];
  timestamp: string;
}

// Rebalance Types
export interface RebalanceCheck {
  shouldRebalance: boolean;
  currentPosition: PortfolioPosition;
  suggestedPosition: Opportunity;
  expectedGain: number;
  reason: string;
}

export interface RebalanceInfo {
  walletAddress: string;
  checks: RebalanceCheck[];
  timestamp: string;
}

// User/Wallet Types
export interface UserWallet {
  address: string;
  chainId: number;
  createdAt: string;
}

export interface SessionKey {
  publicKey: string;
  expiresAt: string;
  permissions: string[];
}

// Transaction Types
export interface DepositTransaction {
  hash: string;
  from: string;
  to: string;
  amount: string;
  asset: string;
  protocol: string;
  chain: string;
  timestamp: string;
  status: "pending" | "confirmed" | "failed";
}

// API Response Types
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: string;
  timestamp: string;
}

// Error Types
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
