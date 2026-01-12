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
} as const;
