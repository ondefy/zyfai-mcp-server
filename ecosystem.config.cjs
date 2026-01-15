// PM2 ecosystem configuration file
// Use this to manage your MCP server process
const dotenv = require("dotenv");
const path = require("path");

// Load .env file from project root
dotenv.config({ path: path.join(__dirname, ".env") });

module.exports = {
  apps: [
    {
      name: "zyfai-mcp-server",
      script: "./build/index.js",
      instances: 1,
      exec_mode: "fork",

      // Environment variables (loaded from .env + defaults)
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3005,
        HOST: process.env.HOST || "0.0.0.0",
        ALLOWED_ORIGINS: process.env.ALLOWED_ORIGINS || "*",
        ZYFAI_API_KEY: process.env.ZYFAI_API_KEY,
      },
    },
  ],
};
