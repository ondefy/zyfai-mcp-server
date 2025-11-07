/**
 * ZyFAI API Service
 * Wrapper service for calling ZyFAI DeFi API endpoints
 */

import axios, {
  AxiosInstance,
  AxiosError,
  type InternalAxiosRequestConfig,
  type AxiosResponse,
} from "axios";
import type { ApiResponse, ApiError } from "../types/zyfai-api.types.js";
import type { PortfolioSummary } from "../types/zyfai-api.types.js";
import type { OpportunitiesResponse } from "../types/zyfai-api.types.js";
import type { RebalanceInfo } from "../types/zyfai-api.types.js";
import { config } from "../config/env.js";

export class ZyFAIApiService {
  private client: AxiosInstance;
  private readonly baseURL: string;
  private readonly apiKey?: string;

  constructor() {
    this.baseURL = config.zyfiApiUrl;
    this.apiKey = config.zyfiApiKey;

    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 30000,
      headers: {
        "Content-Type": "application/json",
        ...(this.apiKey && { "x-api-key": this.apiKey }),
      },
    });

    // Request interceptor for logging
    this.client.interceptors.request.use(
      (config: InternalAxiosRequestConfig) => {
        console.error(
          `[ZyFAI API] ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      (error: AxiosError) => {
        console.error("[ZyFAI API] Request error:", error);
        return Promise.reject(error);
      }
    );

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response: AxiosResponse) => response,
      (error: AxiosError) => {
        const apiError: ApiError = {
          code: error.code || "UNKNOWN_ERROR",
          message: error.message || "An unknown error occurred",
          details: error.response?.data as Record<string, unknown>,
        };
        console.error("[ZyFAI API] Response error:", apiError);
        return Promise.reject(apiError);
      }
    );
  }

  /**
   * Get portfolio for a wallet address
   */
  async getPortfolio(address: string): Promise<ApiResponse<PortfolioSummary>> {
    try {
      const response = await this.client.get<PortfolioSummary>(
        `/api/v2/debank/portfolio/total-portfolio-value/${address}`
      );
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get multi-chain portfolio for a wallet address
   */
  async getMultiChainPortfolio(
    address: string
  ): Promise<ApiResponse<PortfolioSummary>> {
    try {
      const response = await this.client.get<PortfolioSummary>(
        `/api/v2/debank/portfolio/multichain/${address}`
      );
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get top opportunities
   */
  async getTopOpportunities(): Promise<ApiResponse<OpportunitiesResponse>> {
    try {
      const response = await this.client.get<OpportunitiesResponse>(
        "/api/v2/opportunities/top"
      );
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get safe opportunities (low risk)
   */
  async getSafeOpportunities(): Promise<ApiResponse<OpportunitiesResponse>> {
    try {
      const response = await this.client.get<OpportunitiesResponse>(
        "/api/v2/opportunities/safe"
      );
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get degen opportunities (high risk/reward)
   */
  async getDegenOpportunities(): Promise<ApiResponse<OpportunitiesResponse>> {
    try {
      const response = await this.client.get<OpportunitiesResponse>(
        "/api/v2/opportunities/degen"
      );
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get degen ACP opportunities for a specific chain
   */
  async getDegenAcpOpportunities(
    chainId: number
  ): Promise<ApiResponse<OpportunitiesResponse>> {
    try {
      const response = await this.client.get<OpportunitiesResponse>(
        "/api/v2/opportunities/degen-acp",
        {
          params: { chainId },
        }
      );
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get rebalance information for a wallet
   */
  async getRebalanceInfo(
    walletAddress: string,
    isCrossChain?: boolean
  ): Promise<ApiResponse<RebalanceInfo>> {
    try {
      const params: Record<string, unknown> = { walletAddress };
      if (isCrossChain !== undefined) {
        params.isCrossChain = isCrossChain;
      }

      const response = await this.client.get<RebalanceInfo>(
        "/api/v2/rebalance/rebalance-info",
        { params }
      );
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get same-chain rebalance information for a wallet
   */
  async getSameChainRebalanceInfo(
    walletAddress: string
  ): Promise<ApiResponse<RebalanceInfo>> {
    return this.getRebalanceInfo(walletAddress, false);
  }

  /**
   * Get cross-chain rebalance information for a wallet
   */
  async getCrossChainRebalanceInfo(
    walletAddress: string
  ): Promise<ApiResponse<RebalanceInfo>> {
    return this.getRebalanceInfo(walletAddress, true);
  }

  /**
   * Backtest same-chain rebalancing
   */
  async backtestSameChainRebalance(params: {
    walletAddress: string;
    chainId: number;
  }): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.get(
        "/api/v2/rebalance/backtest-same-chain",
        {
          params,
        }
      );
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Backtest cross-chain rebalancing
   */
  async backtestCrossChainRebalance(params: {
    walletAddress: string;
  }): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.get(
        "/api/v2/rebalance/backtest-cross-chain",
        {
          params,
        }
      );
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get best positions for a wallet
   */
  async getBestPositions(walletAddress: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.get("/api/v2/best-positions", {
        params: { walletAddress },
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get risk metrics for a position
   */
  async getRiskMetrics(params: {
    protocol: string;
    chain: string;
    asset: string;
  }): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.get("/api/v2/risk-metrics", {
        params,
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get user earnings
   */
  async getUserEarnings(address: string): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.get(`/api/v2/earnings/${address}`);
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get protocol APY history
   */
  async getProtocolApyHistory(params: {
    protocol: string;
    chain: string;
    days?: number;
  }): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.get("/api/v2/history", {
        params,
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Get Morpho average APYs
   */
  async getMorphoAverageApys(chainId: number): Promise<ApiResponse<unknown>> {
    try {
      const response = await this.client.get("/api/v2/morpho/average-apys", {
        params: { chain_id: chainId },
      });
      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      throw this.handleError(error);
    }
  }

  /**
   * Generic error handler
   */
  private handleError(error: unknown): ApiError {
    if (typeof error === "object" && error !== null && "code" in error) {
      return error as ApiError;
    }
    return {
      code: "UNKNOWN_ERROR",
      message: "An unexpected error occurred",
      details: { originalError: error },
    };
  }
}
