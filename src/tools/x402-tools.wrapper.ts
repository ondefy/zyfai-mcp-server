/**
 * x402 MCP Tools Wrapper
 * Wraps MCP tool handlers with x402 payment verification
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { x402Middleware } from "../middleware/x402.middleware.js";

/**
 * Tool handler function type (compatible with MCP SDK)
 */
type ToolHandler<T> = (args: T) => Promise<{
  [x: string]: unknown;
  content: Array<{
    [x: string]: unknown;
    type: string;
    text?: string;
    data?: string;
    resource?: unknown;
    mimeType?: string;
    _meta?: { [x: string]: unknown };
  }>;
  isError?: boolean;
  _meta?: { [x: string]: unknown };
}>;

/**
 * Payment verification context
 */
interface PaymentContext {
  paymentProof?: string;
  signature?: string;
  payerAddress?: string;
  verified: boolean;
}

/**
 * Extended request arguments with payment context
 */
interface WithPaymentContext {
  _paymentContext?: PaymentContext;
}

/**
 * x402 Tool Wrapper Class
 */
export class X402ToolWrapper {
  private enabled: boolean;

  constructor() {
    this.enabled = process.env.X402_ENABLED === "true";
  }

  /**
   * Wrap a tool handler with payment verification
   */
  wrapToolHandler<T extends Record<string, unknown>>(
    toolName: string,
    originalHandler: ToolHandler<T>
  ): ToolHandler<T & WithPaymentContext> {
    // If x402 is disabled, return original handler
    if (!this.enabled) {
      return originalHandler as ToolHandler<T & WithPaymentContext>;
    }

    // Check if this tool requires payment
    const pricing = x402Middleware.getPricing(toolName);
    if (!pricing) {
      return originalHandler as ToolHandler<T & WithPaymentContext>;
    }

    // Return wrapped handler with payment verification
    return async (args: T & WithPaymentContext) => {
      try {
        // Verify payment from context
        const paymentContext = args._paymentContext;

        if (!paymentContext || !paymentContext.verified) {
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify(
                  {
                    error: "Payment Required",
                    message: `This tool requires payment of ${this.formatAmount(
                      pricing.amount,
                      pricing.token
                    )}`,
                    pricing: {
                      amount: pricing.amount,
                      token: pricing.token,
                      network: pricing.network,
                      formattedAmount: this.formatAmount(
                        pricing.amount,
                        pricing.token
                      ),
                    },
                    facilitator: process.env.X402_FACILITATOR_URL,
                    instructions: {
                      step1: "Obtain payment proof from your wallet",
                      step2: "Include payment headers in your request",
                      step3: "Retry the tool call",
                    },
                  },
                  null,
                  2
                ),
              },
            ],
            isError: true,
          };
        }

        // Payment verified, call original handler
        console.error(
          `[x402] Payment verified for ${toolName} from ${paymentContext.payerAddress}`
        );
        return await originalHandler(args);
      } catch (error) {
        console.error(
          `[x402] Error in wrapped handler for ${toolName}:`,
          error
        );
        return {
          content: [
            {
              type: "text",
              text: `Error: ${
                error instanceof Error ? error.message : "Unknown error"
              }`,
            },
          ],
          isError: true,
        };
      }
    };
  }

  /**
   * Register a tool with payment verification
   */
  registerPaidTool<T extends z.ZodObject<any>>(
    server: McpServer,
    toolName: string,
    description: string,
    inputSchema: T,
    handler: ToolHandler<z.infer<T>>
  ) {
    const wrappedHandler = this.wrapToolHandler(toolName, handler);
    server.tool(
      toolName,
      description,
      inputSchema.shape,
      wrappedHandler as any
    );
  }

  /**
   * Format amount for display
   */
  private formatAmount(amount: string, token: string): string {
    const decimals = token === "USDC" ? 6 : 18;
    const value = parseInt(amount) / Math.pow(10, decimals);
    return `${value} ${token}`;
  }

  /**
   * Check if tool requires payment
   */
  requiresPayment(toolName: string): boolean {
    return this.enabled && !!x402Middleware.getPricing(toolName);
  }

  /**
   * Get pricing information for a tool
   */
  getToolPricing(toolName: string) {
    const pricing = x402Middleware.getPricing(toolName);
    if (!pricing) return null;

    return {
      ...pricing,
      formattedAmount: this.formatAmount(pricing.amount, pricing.token),
    };
  }
}

/**
 * Create singleton instance
 */
export const x402ToolWrapper = new X402ToolWrapper();
