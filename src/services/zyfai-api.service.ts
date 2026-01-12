/**
 * ZyFAI SDK Service
 * Wrapper service for Zyfai SDK
 */

import { ZyfaiSDK, SupportedChainId } from "@zyfai/sdk";
import { config } from "../config/env.js";

export class ZyFAIApiService {
  private sdk: ZyfaiSDK;

  constructor() {
    if (!config.zyfiApiKey) {
      throw new Error("ZYFAI_API_KEY is required");
    }

    this.sdk = new ZyfaiSDK({
      apiKey: config.zyfiApiKey,
    });
  }

  /**
   * Get SDK instance
   */
  getSDK(): ZyfaiSDK {
    return this.sdk;
  }

  // All methods delegate to SDK
  async getAvailableProtocols(chainId: SupportedChainId) {
    return await this.sdk.getAvailableProtocols(chainId);
  }

  async getPositions(userAddress: string, chainId?: SupportedChainId) {
    return await this.sdk.getPositions(userAddress, chainId);
  }

  async getUserDetails() {
    return await this.sdk.getUserDetails();
  }

  async getTVL() {
    return await this.sdk.getTVL();
  }

  async getVolume() {
    return await this.sdk.getVolume();
  }

  async getActiveWallets(chainId: SupportedChainId) {
    return await this.sdk.getActiveWallets(chainId);
  }

  async getSmartWalletByEOA(eoaAddress: string) {
    return await this.sdk.getSmartWalletByEOA(eoaAddress);
  }

  async getFirstTopup(walletAddress: string, chainId: SupportedChainId) {
    return await this.sdk.getFirstTopup(walletAddress, chainId);
  }

  async getHistory(
    walletAddress: string,
    chainId: SupportedChainId,
    options?: {
      limit?: number;
      offset?: number;
      fromDate?: string;
      toDate?: string;
    }
  ) {
    return await this.sdk.getHistory(walletAddress, chainId, options);
  }

  async getOnchainEarnings(walletAddress: string) {
    return await this.sdk.getOnchainEarnings(walletAddress);
  }

  async calculateOnchainEarnings(walletAddress: string) {
    return await this.sdk.calculateOnchainEarnings(walletAddress);
  }

  async getDailyEarnings(
    walletAddress: string,
    startDate?: string,
    endDate?: string
  ) {
    return await this.sdk.getDailyEarnings(walletAddress, startDate, endDate);
  }

  async getDebankPortfolio(walletAddress: string) {
    return await this.sdk.getDebankPortfolio(walletAddress);
  }

  async getSafeOpportunities(chainId?: SupportedChainId) {
    return await this.sdk.getSafeOpportunities(chainId);
  }

  async getDegenStrategies(chainId?: SupportedChainId) {
    return await this.sdk.getDegenStrategies(chainId);
  }

  async getDailyApyHistory(
    walletAddress: string,
    days: "7D" | "14D" | "30D" = "7D"
  ) {
    return await this.sdk.getDailyApyHistory(walletAddress, days);
  }

  async getRebalanceFrequency(walletAddress: string) {
    return await this.sdk.getRebalanceFrequency(walletAddress);
  }

  async getAPYPerStrategy(
    crossChain: boolean = false,
    days: number = 7,
    strategy: string = "safe"
  ) {
    return await this.sdk.getAPYPerStrategy(crossChain, days, strategy);
  }
}
