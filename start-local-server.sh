#!/bin/bash
# Start local MCP server for use with Claude Desktop via proxy

echo "🚀 Starting Local ZyFAI MCP Server"
echo "=================================="
echo ""

# Check if build exists
if [ ! -d "build" ]; then
  echo "Building server..."
  npm run build
fi

# Set environment variables
export ZYFAI_API_URL="${ZYFAI_API_URL:-https://defiapi.zyf.ai}"
export PORT="${PORT:-3005}"
export HOST="${HOST:-0.0.0.0}"

echo "Configuration:"
echo "  API URL: $ZYFAI_API_URL"
echo "  Port: $PORT"
echo "  Host: $HOST"
echo ""
echo "Server will be available at: http://localhost:$PORT"
echo "Press Ctrl+C to stop"
echo ""
echo "=================================="
echo ""

# Start the server
node build/index.js

