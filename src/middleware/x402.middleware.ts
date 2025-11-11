/**
 * x402 Payment Middleware
 * Handles payment verification for MCP tools using x402 protocol
 */

import type { Request, Response, NextFunction } from "express";

/**
 * x402 Payment Configuration
 */
export interface X402Config {
  facilitatorUrl: string;
  verifyEndpoint?: string;
  settleEndpoint?: string;
}

/**
 * Pricing configuration for different endpoints
 */
export interface PricingConfig {
  [toolName: string]: {
    amount: string; // Amount in token smallest unit (e.g., "1000000" for 1 USDC)
    token: string; // Token address or symbol
    network: string; // Network name (e.g., "base", "solana")
  };
}

/**
 * x402 Payment Verification Response
 */
interface VerificationResponse {
  valid: boolean;
  message?: string;
  transactionId?: string;
}

/**
 * Default x402 configuration
 */
const DEFAULT_CONFIG: X402Config = {
  facilitatorUrl:
    process.env.X402_FACILITATOR_URL || "https://facilitator.x402.rs",
  verifyEndpoint: "/verify",
  settleEndpoint: "/settle",
};

/**
 * Default pricing for tools
 */
const DEFAULT_PRICING: PricingConfig = {
  "get-multichain-portfolio": {
    amount: "1000000", // 1 USDC (6 decimals)
    token: "USDC",
    network: "base",
  },
  "get-user-earnings": {
    amount: "500000", // 0.5 USDC (6 decimals)
    token: "USDC",
    network: "base",
  },
  "get-best-positions": {
    amount: "750000", // 0.75 USDC (6 decimals)
    token: "USDC",
    network: "base",
  },
};

/**
 * x402 Middleware Class
 */
export class X402Middleware {
  private config: X402Config;
  private pricing: PricingConfig;
  private enabled: boolean;

  constructor(config?: Partial<X402Config>, pricing?: PricingConfig) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.pricing = pricing || DEFAULT_PRICING;
    this.enabled = process.env.X402_ENABLED === "true";

    if (this.enabled) {
      console.error(
        `[x402] Middleware enabled with facilitator: ${this.config.facilitatorUrl}`
      );
      console.error(`[x402] Pricing configuration:`, this.pricing);
    } else {
      console.error(
        `[x402] Middleware disabled. Set X402_ENABLED=true to enable.`
      );
    }
  }

  /**
   * Create middleware function for Express
   */
  middleware() {
    return async (req: Request, res: Response, next: NextFunction) => {
      // Skip if x402 is disabled
      if (!this.enabled) {
        return next();
      }

      // Extract tool name from request (MCP-specific logic)
      const toolName = this.extractToolName(req);

      // Skip if tool doesn't require payment
      if (!toolName || !this.pricing[toolName]) {
        return next();
      }

      try {
        // Verify payment
        const isValid = await this.verifyPayment(req, toolName);

        if (!isValid) {
          return res.status(402).json({
            error: "Payment Required",
            message: `This endpoint requires payment of ${this.formatAmount(
              toolName
            )}`,
            pricing: this.pricing[toolName],
            facilitator: this.config.facilitatorUrl,
          });
        }

        // Payment verified, proceed with request
        next();
      } catch (error) {
        console.error("[x402] Payment verification error:", error);
        return res.status(500).json({
          error: "Payment Verification Failed",
          message:
            error instanceof Error ? error.message : "Unknown error occurred",
        });
      }
    };
  }

  /**
   * Extract tool name from MCP request
   */
  private extractToolName(req: Request): string | null {
    try {
      // For SSE/MCP protocol, check the request body
      if (req.body && req.body.method === "tools/call") {
        return req.body.params?.name || null;
      }

      // For direct HTTP calls, check URL path
      const path = req.path;
      if (path.includes("/tools/")) {
        const parts = path.split("/");
        return parts[parts.indexOf("tools") + 1] || null;
      }

      return null;
    } catch (error) {
      console.error("[x402] Error extracting tool name:", error);
      return null;
    }
  }

  /**
   * Verify payment with facilitator
   */
  private async verifyPayment(
    req: Request,
    toolName: string
  ): Promise<boolean> {
    try {
      // Extract payment proof from headers
      const paymentProof = req.headers["x-payment-proof"] as string;
      const paymentSignature = req.headers["x-payment-signature"] as string;
      const payerAddress = req.headers["x-payer-address"] as string;

      if (!paymentProof || !paymentSignature || !payerAddress) {
        console.error("[x402] Missing payment headers");
        return false;
      }

      const pricing = this.pricing[toolName];
      const verifyUrl = `${this.config.facilitatorUrl}${this.config.verifyEndpoint}`;

      // Call facilitator to verify payment
      const response = await fetch(verifyUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentProof,
          signature: paymentSignature,
          payer: payerAddress,
          amount: pricing.amount,
          token: pricing.token,
          network: pricing.network,
          metadata: {
            toolName,
            timestamp: Date.now(),
          },
        }),
      });

      if (!response.ok) {
        console.error(
          `[x402] Facilitator returned error: ${response.status} ${response.statusText}`
        );
        return false;
      }

      const result = (await response.json()) as VerificationResponse;

      if (result.valid) {
        console.error(
          `[x402] Payment verified for ${toolName} (tx: ${result.transactionId})`
        );

        // Settle payment asynchronously (fire and forget)
        this.settlePayment(result.transactionId || "", toolName).catch(
          (error) => {
            console.error("[x402] Settlement error:", error);
          }
        );
      }

      return result.valid;
    } catch (error) {
      console.error("[x402] Payment verification error:", error);
      return false;
    }
  }

  /**
   * Settle payment with facilitator
   */
  private async settlePayment(
    transactionId: string,
    toolName: string
  ): Promise<void> {
    try {
      const settleUrl = `${this.config.facilitatorUrl}${this.config.settleEndpoint}`;

      const response = await fetch(settleUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transactionId,
          toolName,
          timestamp: Date.now(),
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Settlement failed: ${response.status} ${response.statusText}`
        );
      }

      console.error(
        `[x402] Payment settled for ${toolName} (tx: ${transactionId})`
      );
    } catch (error) {
      console.error("[x402] Settlement error:", error);
      throw error;
    }
  }

  /**
   * Format amount for display
   */
  private formatAmount(toolName: string): string {
    const pricing = this.pricing[toolName];
    if (!pricing) return "unknown";

    const decimals = pricing.token === "USDC" ? 6 : 18;
    const amount = parseInt(pricing.amount) / Math.pow(10, decimals);
    return `${amount} ${pricing.token}`;
  }

  /**
   * Get pricing for a specific tool
   */
  getPricing(toolName: string) {
    return this.pricing[toolName];
  }

  /**
   * Update pricing for a tool
   */
  updatePricing(toolName: string, pricing: PricingConfig[string]) {
    this.pricing[toolName] = pricing;
    console.error(`[x402] Updated pricing for ${toolName}:`, pricing);
  }

  /**
   * Get all pricing configuration
   */
  getAllPricing(): PricingConfig {
    return { ...this.pricing };
  }
}

/**
 * Create and export singleton instance
 */
export const x402Middleware = new X402Middleware();

/**
 * Express middleware function
 */
export const x402PaymentMiddleware =
  x402Middleware.middleware.bind(x402Middleware);
