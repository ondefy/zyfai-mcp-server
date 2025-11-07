#!/bin/bash

# Deploy Critical Fix to Remote Server
# This fixes the POST /messages handler to actually forward messages to the transport

set -e

echo "🚀 Deploying Critical SSE Fix to sdk.zyf.ai"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Step 1: Sync files to remote server
echo "📦 Step 1: Syncing files to remote server..."
rsync -avz --progress \
  --exclude='node_modules' \
  --exclude='.git' \
  --exclude='*.log' \
  /Users/ayushgupta/Projects/mcp-server-template/ \
  root@sdk.zyf.ai:/root/erc8004-api-sdk/

echo ""
echo "✅ Files synced successfully"
echo ""

# Step 2: SSH and rebuild on remote server
echo "🔧 Step 2: Rebuilding on remote server..."
ssh root@sdk.zyf.ai << 'ENDSSH'
cd /root/erc8004-api-sdk/

# Clean build
echo "  🗑️  Cleaning old build..."
rm -rf build

# Install dependencies
echo "  📦 Installing dependencies..."
npm install --silent

# Build
echo "  🔨 Building TypeScript..."
npm run build

# Verify the fix is in the build
echo ""
echo "  ✔️  Verifying handlePostMessage fix..."
if grep -q "handlePostMessage" build/src/routes/http.routes.js; then
  echo "  ✅ Fix verified in build!"
else
  echo "  ❌ Fix NOT found in build!"
  exit 1
fi

# Restart PM2
echo ""
echo "  🔄 Restarting PM2..."
pm2 stop zyfai-mcp-server || true
pm2 delete zyfai-mcp-server || true
pm2 start ecosystem.config.cjs

# Check status
echo ""
echo "  📊 PM2 Status:"
pm2 status

# Check logs
echo ""
echo "  📜 Recent logs:"
pm2 logs zyfai-mcp-server --lines 10 --nostream

ENDSSH

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "✅ Deployment Complete!"
echo ""
echo "🧪 Test the fix:"
echo "  curl -N https://sdk.zyf.ai/sse | head -3"
echo ""
echo "🔌 Try connecting from Claude Desktop:"
echo "  Restart Claude Desktop and check the connection"
echo ""

