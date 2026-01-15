#!/bin/bash
set -e

echo "🚀 Deploying Zyfai MCP Server to Digital Ocean..."
echo ""

# Configuration
SERVER="root@159.89.19.102"
REMOTE_DIR="/root/erc8004-mcp-server"

# Step 1: Build locally
echo "📦 Step 1: Building project..."
pnpm run build
echo "✅ Build complete"
echo ""

# Step 2: Upload files
echo "⬆️  Step 2: Uploading files to server..."
rsync -avz --delete \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude '.env.local' \
  --exclude 'test-example' \
  --exclude '*.log' \
  ./ ${SERVER}:${REMOTE_DIR}/
echo "✅ Upload complete"
echo ""

# Step 3: Install dependencies and restart on server
echo "🔄 Step 3: Installing dependencies and restarting server..."
ssh ${SERVER} << EOF
  cd ${REMOTE_DIR}
  
  # Install production dependencies
  pnpm install --prod
  
  # Check if .env exists
  if [ ! -f .env ]; then
    echo "⚠️  WARNING: .env file not found on server!"
    echo "Please create .env with ZYFAI_API_KEY"
  fi
  
  # Restart PM2
  pm2 restart ecosystem.config.cjs || pm2 start ecosystem.config.cjs
  pm2 save
  
  echo ""
  echo "✅ Server restarted"
  echo ""
  echo "📊 PM2 Status:"
  pm2 status
  
  echo ""
  echo "📝 Recent logs:"
  pm2 logs --lines 10 --nostream
EOF

echo ""
echo "✅ Deployment complete!"
echo ""
echo "🔍 Testing endpoints..."
echo ""

# Test health endpoint
echo "Testing /health..."
curl -s https://mcp.zyf.ai/health | head -n 5 || echo "❌ Health check failed"

echo ""
echo "✨ Done! Check the logs above for any errors."
