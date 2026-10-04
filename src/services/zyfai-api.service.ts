/**
 * Zyfai SDK Service
 * Per-request SDK instances for authenticated MCP tool calls.
 */

import {
  ZyfaiSDK,
  getDataApiBaseUrl,
  getExecutionApiBaseUrl,
  type SDKConfig,
  type SupportedChainId,
} from "@zyfai/sdk";
import type {
  CustomizationConfig,
  SimulateBestPositionsParams,
  Strategy,
  SupportedAsset,
  UpdateUserProfileRequest,
} from "@zyfai/sdk";
import { config } from "../config/env.js";
import { exchangeMcpSessionCredential } from "../auth/session-credential.js";
import { requireMcpAuth } from "../auth/request-context.js";

export class ZyfaiApiService {
  private readonly baseConfig: SDKConfig;

  constructor() {
    const apiKey = config.zyfiApiKey || "placeholder-key-for-testing";
    if (!config.zyfiApiKey) {
      console.warn("\n WARNING: ZYFAI_API_KEY not set. API calls will fail.");
    }
    this.baseConfig = buildSdkConfig(apiKey);
  }

  /** Anonymous SDK (public/partner-key reads only). */
  getPublicSDK(): ZyfaiSDK {
    return new ZyfaiSDK(this.baseConfig);
  }

  /** SDK bound to the current MCP user's Zyfai JWT (via server-side session exchange). */
  async getAuthenticatedSDK(): Promise<ZyfaiSDK> {
    const auth = requireMcpAuth();
    const accessToken = await exchangeMcpSessionCredential(auth.mcpAccessToken);
    const sdk = ZyfaiSDK.forUser(this.baseConfig, {
      accessToken,
      userId: auth.userId,
      eoa: auth.eoa as `0x${string}`,
      channel: "agent",
    });
    return sdk;
  }

  private async sdkForUserScoped(): Promise<ZyfaiSDK> {
    return this.getAuthenticatedSDK();
  }

  // --- Public reads (partner key) ---

  async getAvailableProtocols(chainId: SupportedChainId) {
    return this.getPublicSDK().getAvailableProtocols(chainId);
  }

  async getConservativeOpportunities(chainId?: SupportedChainId) {
    return this.getPublicSDK().getConservativeOpportunities(chainId);
  }

  async getAggressiveOpportunities(chainId?: SupportedChainId) {
    return this.getPublicSDK().getAggressiveOpportunities(chainId);
  }

  // --- Authenticated reads ---

  async getPortfolio(userAddress: string) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getPortfolio(userAddress);
  }

  async getPositions(userAddress: string, chainId?: SupportedChainId) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getPositions(userAddress, chainId);
  }

  async getUserDetails(asset?: SupportedAsset) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getUserDetails(asset);
  }

  async simulateBestPositions(params: SimulateBestPositionsParams) {
    const sdk = await this.sdkForUserScoped();
    return sdk.simulateBestPositions(params);
  }

  async getHistory(
    walletAddress: string,
    chainId: SupportedChainId,
    options?: {
      limit?: number;
      offset?: number;
      fromDate?: string;
      toDate?: string;
    },
  ) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getHistory(walletAddress, chainId, options);
  }

  async getFirstTopup(walletAddress: string, chainId: SupportedChainId) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getFirstTopup(walletAddress, chainId);
  }

  async getOnchainEarnings(walletAddress: string) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getOnchainEarnings(walletAddress);
  }

  async getDailyEarnings(
    walletAddress: string,
    startDate?: string,
    endDate?: string,
  ) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getDailyEarnings(walletAddress, startDate, endDate);
  }

  async getDailyApyHistory(
    walletAddress: string,
    days: "7D" | "14D" | "30D" = "7D",
  ) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getDailyApyHistory(walletAddress, days);
  }

  async getRebalanceFrequency(walletAddress: string) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getRebalanceFrequency(walletAddress);
  }

  // --- Writes ---

  async updateUserProfile(request: UpdateUserProfileRequest) {
    const sdk = await this.sdkForUserScoped();
    return sdk.updateUserProfile(request);
  }

  async setAssetStrategy(params: {
    asset: SupportedAsset;
    strategy?: Strategy;
    chains?: SupportedChainId[];
  }) {
    const sdk = await this.sdkForUserScoped();
    return sdk.setAssetStrategy(params);
  }

  async customizeBatch(customizations: CustomizationConfig[]) {
    const sdk = await this.sdkForUserScoped();
    return sdk.customizeBatch(customizations);
  }

  async prepareDeposit(params: {
    userAddress: string;
    chainId: SupportedChainId;
    amount: string;
    asset: SupportedAsset;
  }) {
    const sdk = await this.sdkForUserScoped();
    return sdk.prepareDeposit(params);
  }

  async withdrawFunds(
    userAddress: string,
    chainId: SupportedChainId,
    amount?: string,
    tokenSymbol?: string,
  ) {
    const sdk = await this.sdkForUserScoped();
    return sdk.withdrawFunds(userAddress, chainId, amount, tokenSymbol);
  }

  async logDeposit(
    chainId: SupportedChainId,
    txHash: string,
    amount: string,
    tokenAddress?: string,
  ) {
    const sdk = await this.sdkForUserScoped();
    return sdk.logDeposit(chainId, txHash, amount, tokenAddress);
  }

  async getDepositStatus(depositId: string) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getDepositStatus(depositId);
  }

  async waitForDepositCredit(depositId: string, chainId: SupportedChainId) {
    const sdk = await this.sdkForUserScoped();
    return sdk.waitForDepositCredit(depositId, chainId);
  }

  async waitForAgentDepositHandover(
    actionId: string,
    chainId: SupportedChainId,
    options?: {
      waitForCredit?: boolean;
      timeoutMs?: number;
    },
  ) {
    const sdk = await this.sdkForUserScoped();
    return sdk.waitForAgentDepositHandover(actionId, chainId, options);
  }

  async getAssetTypeSettings() {
    const sdk = await this.sdkForUserScoped();
    return sdk.getAssetTypeSettings();
  }

  async getAgentDepositIntentStatus(actionId: string) {
    const sdk = await this.sdkForUserScoped();
    return sdk.getAgentDepositIntentStatus(actionId);
  }

  async createAgentDepositIntent(params: {
    chainId: SupportedChainId;
    amount: string;
    asset: SupportedAsset;
  }) {
    const sdk = await this.sdkForUserScoped();
    return sdk.createAgentDepositIntent(params);
  }

  async consumeAgentDepositIntent(
    actionId: string,
    params: {
      chainId: SupportedChainId;
      amount: string;
      asset: SupportedAsset;
      txHash: string;
      depositId: string;
    },
  ) {
    const sdk = await this.sdkForUserScoped();
    return sdk.consumeAgentDepositIntent(actionId, params);
  }
}

function buildSdkConfig(apiKey: string): SDKConfig {
  const env = config.backendEnvironment;
  const executionApiUrl =
    config.executionApiUrl ?? (env ? getExecutionApiBaseUrl(env) : undefined);
  const dataApiUrl =
    config.dataApiUrl ?? (env ? getDataApiBaseUrl(env) : undefined);

  return {
    apiKey,
    ...(executionApiUrl ? { executionApiUrl } : {}),
    ...(dataApiUrl ? { dataApiUrl } : {}),
  };
}
