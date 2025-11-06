/**
 * Environment Configuration
 * Centralized environment variable management
 */

export const config = {
  // Server configuration
  port: process.env.PORT ? parseInt(process.env.PORT) : 3005,
  host: process.env.HOST || "0.0.0.0",
  nodeEnv: process.env.NODE_ENV || "development",

  // CORS configuration
  allowedOrigins: process.env.ALLOWED_ORIGINS?.split(",") || ["*"],

  // ZyFAI API configuration
  zyfiApiUrl: process.env.ZYFAI_API_URL || "https://defiapi.zyf.ai",
  zyfiApiKey: process.env.ZYFAI_API_KEY,
} as const;
