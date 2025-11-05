// PM2 ecosystem configuration file
// Use this to manage your MCP server process

module.exports = {
  apps: [
    {
      name: "zyfai-mcp-server",
      script: "./build/index.js",
      instances: 1,
      exec_mode: "fork",

      // Environment variables
      env: {
        NODE_ENV: "production",
        PORT: 3005,
        HOST: "0.0.0.0",
      },
    },
  ],
};
