/**
 * Zyfai SDK Service
 * Wrapper service for Zyfai SDK with support for per-request API keys
 */

import { ZyfaiSDK, SupportedChainId } from "@zyfai/sdk";
import { config } from "../config/env.js";

export class ZyfaiApiService {
  private defaultSdk: ZyfaiSDK;
  private sdkCache: Map<string, ZyfaiSDK> = new Map();

  constructor() {
    // Initialize default SDK with server's API key (if provided)
    if (!config.zyfiApiKey) {
      throw new Error("ZYFAI_API_KEY not set on server.");
    } else {
      this.defaultSdk = new ZyfaiSDK({
        apiKey: config.zyfiApiKey,
      });
    }
  }

  /**
   * Get SDK instance - either client-specific or default
   * @param apiKey - Optional client-provided API key
   */
  getSDK(apiKey?: string): ZyfaiSDK {
    // If no API key provided, use default
    if (!apiKey) {
      return this.defaultSdk;
    }

    // Check cache for this API key
    if (this.sdkCache.has(apiKey)) {
      return this.sdkCache.get(apiKey)!;
    }

    // Create new SDK instance for this API key
    // Only create SDK if we have a valid API key string
    const sdk = new ZyfaiSDK({ apiKey: apiKey as string });

    // Cache it (with size limit to prevent memory issues)
    if (this.sdkCache.size > 100) {
      // Remove oldest entry
      const firstKey = this.sdkCache.keys().next().value;
      if (firstKey) {
        this.sdkCache.delete(firstKey);
      }
    }

    this.sdkCache.set(apiKey, sdk);
    return sdk;
  }

  // All methods now accept an optional API key parameter
  async getAvailableProtocols(chainId: SupportedChainId, apiKey?: string) {
    return await this.getSDK(apiKey).getAvailableProtocols(chainId);
  }

  async getPositions(
    userAddress: string,
    chainId?: SupportedChainId,
    apiKey?: string
  ) {
    return await this.getSDK(apiKey).getPositions(userAddress, chainId);
  }

  async getUserDetails(apiKey?: string) {
    return await this.getSDK(apiKey).getUserDetails();
  }

  async getTVL(apiKey?: string) {
    return await this.getSDK(apiKey).getTVL();
  }

  async getVolume(apiKey?: string) {
    return await this.getSDK(apiKey).getVolume();
  }

  async getActiveWallets(chainId: SupportedChainId, apiKey?: string) {
    return await this.getSDK(apiKey).getActiveWallets(chainId);
  }

  async getSmartWalletByEOA(eoaAddress: string, apiKey?: string) {
    return await this.getSDK(apiKey).getSmartWalletByEOA(eoaAddress);
  }

  async getFirstTopup(
    walletAddress: string,
    chainId: SupportedChainId,
    apiKey?: string
  ) {
    return await this.getSDK(apiKey).getFirstTopup(walletAddress, chainId);
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
    apiKey?: string
  ) {
    return await this.getSDK(apiKey).getHistory(
      walletAddress,
      chainId,
      options
    );
  }

  async getOnchainEarnings(walletAddress: string, apiKey?: string) {
    return await this.getSDK(apiKey).getOnchainEarnings(walletAddress);
  }

  async calculateOnchainEarnings(walletAddress: string, apiKey?: string) {
    return await this.getSDK(apiKey).calculateOnchainEarnings(walletAddress);
  }

  async getDailyEarnings(
    walletAddress: string,
    startDate?: string,
    endDate?: string,
    apiKey?: string
  ) {
    return await this.getSDK(apiKey).getDailyEarnings(
      walletAddress,
      startDate,
      endDate
    );
  }

  async getDebankPortfolio(walletAddress: string, apiKey?: string) {
    return await this.getSDK(apiKey).getDebankPortfolio(walletAddress);
  }

  async getSafeOpportunities(chainId?: SupportedChainId, apiKey?: string) {
    return await this.getSDK(apiKey).getSafeOpportunities(chainId);
  }

  async getDegenStrategies(chainId?: SupportedChainId, apiKey?: string) {
    return await this.getSDK(apiKey).getDegenStrategies(chainId);
  }

  async getDailyApyHistory(
    walletAddress: string,
    days: "7D" | "14D" | "30D" = "7D",
    apiKey?: string
  ) {
    return await this.getSDK(apiKey).getDailyApyHistory(walletAddress, days);
  }

  async getRebalanceFrequency(walletAddress: string, apiKey?: string) {
    return await this.getSDK(apiKey).getRebalanceFrequency(walletAddress);
  }

  async getAPYPerStrategy(
    crossChain: boolean = false,
    days: number = 7,
    strategy: string = "safe",
    apiKey?: string
  ) {
    return await this.getSDK(apiKey).getAPYPerStrategy(
      crossChain,
      days,
      strategy
    );
  }
}
