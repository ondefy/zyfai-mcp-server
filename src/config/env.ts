/**
 * Environment Configuration
 * Centralized environment variable management
 */

export const config = {
  // Server configuration
  port: process.env.PORT ? parseInt(process.env.PORT) : 3005,
  host: process.env.HOST || "0.0.0.0",

  // CORS configuration
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["*"],

  // Zyfai API configuration
  zyfiApiKey: process.env.ZYFAI_API_KEY,

  // x402 Payment configuration
  x402Enabled: process.env.X402_ENABLED === "true",
  x402FacilitatorUrl:
    process.env.X402_FACILITATOR_URL || "https://facilitator.x402.rs",
  x402ReceiverAddress: process.env.X402_RECEIVER_ADDRESS,
} as const;
