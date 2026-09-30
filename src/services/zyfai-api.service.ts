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
import { getMcpAuth, requireMcpAuth } from "../auth/request-context.js";

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

  /** SDK bound to the current MCP user's Zyfai JWT. */
  getAuthenticatedSDK(): ZyfaiSDK {
    const auth = requireMcpAuth();
    return ZyfaiSDK.forUser(this.baseConfig, {
      accessToken: auth.zyfaiAccessToken,
      userId: auth.userId,
      eoa: auth.eoa as `0x${string}`,
    });
  }

  private sdkForUserScoped(): ZyfaiSDK {
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

  async getTVL() {
    return this.getPublicSDK().getTVL();
  }

  async getVolume() {
    return this.getPublicSDK().getVolume();
  }

  async getActiveWallets(chainId: SupportedChainId) {
    return this.getPublicSDK().getActiveWallets(chainId);
  }

  async getSmartWalletByEOA(eoaAddress: string) {
    return this.getPublicSDK().getSmartWalletByEOA(eoaAddress);
  }

  async getRebalanceFrequency(walletAddress: string) {
    return this.getPublicSDK().getRebalanceFrequency(walletAddress);
  }

  async getAPYPerStrategy(
    crossChain: boolean = false,
    days: number = 7,
    strategy: string = "conservative",
  ) {
    return this.getPublicSDK().getAPYPerStrategy(
      crossChain,
      days,
      strategy as "conservative" | "aggressive",
    );
  }

  // --- Authenticated reads ---

  async getPortfolio(userAddress: string) {
    const sdk = this.sdkForUserScoped();
    return sdk.getPortfolio(userAddress);
  }

  async getPositions(userAddress: string, chainId?: SupportedChainId) {
    const sdk = this.sdkForUserScoped();
    return sdk.getPositions(userAddress, chainId);
  }

  async getUserDetails(asset?: SupportedAsset) {
    const sdk = this.sdkForUserScoped();
    return sdk.getUserDetails(asset);
  }

  async simulateBestPositions(params: SimulateBestPositionsParams) {
    const sdk = this.sdkForUserScoped();
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
    const auth = getMcpAuth();
    const sdk = auth ? this.sdkForUserScoped() : this.getPublicSDK();
    return sdk.getHistory(walletAddress, chainId, options);
  }

  async getFirstTopup(walletAddress: string, chainId: SupportedChainId) {
    const sdk = this.getPublicSDK();
    return sdk.getFirstTopup(walletAddress, chainId);
  }

  async getOnchainEarnings(walletAddress: string) {
    const sdk = this.getPublicSDK();
    return sdk.getOnchainEarnings(walletAddress);
  }

  async getDailyEarnings(
    walletAddress: string,
    startDate?: string,
    endDate?: string,
  ) {
    const sdk = this.getPublicSDK();
    return sdk.getDailyEarnings(walletAddress, startDate, endDate);
  }

  async getDailyApyHistory(
    walletAddress: string,
    days: "7D" | "14D" | "30D" = "7D",
  ) {
    const sdk = this.getPublicSDK();
    return sdk.getDailyApyHistory(walletAddress, days);
  }

  // --- Writes ---

  async updateUserProfile(request: UpdateUserProfileRequest) {
    const sdk = this.sdkForUserScoped();
    return sdk.updateUserProfile(request);
  }

  async customizeBatch(customizations: CustomizationConfig[]) {
    const sdk = this.sdkForUserScoped();
    return sdk.customizeBatch(customizations);
  }

  async prepareEnterPosition(params: {
    userAddress: string;
    chainId: SupportedChainId;
    amount: string;
    asset: SupportedAsset;
    strategy?: Strategy;
  }) {
    const sdk = this.sdkForUserScoped();
    return sdk.prepareEnterPosition(params);
  }

  async logDeposit(
    chainId: SupportedChainId,
    txHash: string,
    amount: string,
    tokenAddress?: string,
  ) {
    const sdk = this.sdkForUserScoped();
    return sdk.logDeposit(chainId, txHash, amount, tokenAddress);
  }

  async getDepositStatus(depositId: string) {
    const sdk = this.sdkForUserScoped();
    return sdk.getDepositStatus(depositId);
  }

  async waitForDepositCredit(
    depositId: string,
    chainId: SupportedChainId,
  ) {
    const sdk = this.sdkForUserScoped();
    return sdk.waitForDepositCredit(depositId, chainId);
  }

  async getAgentMandate() {
    const sdk = this.sdkForUserScoped();
    return sdk.getAgentMandate();
  }

  async setAgentMandate(
    request: import("@zyfai/sdk").UpsertAgentMandateRequest,
  ) {
    const sdk = this.sdkForUserScoped();
    return sdk.setAgentMandate(request);
  }

  async revokeAgentMandate() {
    const sdk = this.sdkForUserScoped();
    return sdk.revokeAgentMandate();
  }
}

function buildSdkConfig(apiKey: string): SDKConfig {
  const env = config.backendEnvironment;
  const executionApiUrl =
    config.executionApiUrl ??
    (env ? getExecutionApiBaseUrl(env) : undefined);
  const dataApiUrl =
    config.dataApiUrl ?? (env ? getDataApiBaseUrl(env) : undefined);

  return {
    apiKey,
    ...(executionApiUrl ? { executionApiUrl } : {}),
    ...(dataApiUrl ? { dataApiUrl } : {}),
  };
}
