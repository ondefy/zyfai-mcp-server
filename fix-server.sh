#!/bin/bash
set -e

echo "🔧 Fixing PM2 Configuration on Server"
echo "======================================"
echo ""

SERVER="root@159.89.19.102"

echo "Step 1: Finding the correct PM2 app directory..."
ssh ${SERVER} << 'EOF'
  # Find where PM2 is actually running the app from
  PM2_APP_PATH=$(pm2 info zyfai-mcp-server 2>/dev/null | grep "exec cwd" | awk '{print $4}')
  
  if [ -z "$PM2_APP_PATH" ]; then
    echo "❌ Could not find PM2 app path"
    echo "Let's check PM2 list:"
    pm2 list
    echo ""
    echo "Trying alternative method..."
    PM2_APP_PATH=$(pm2 jlist | grep -A 5 "zyfai" | grep "pm_cwd" | cut -d'"' -f4 | head -1)
  fi
  
  echo "📍 PM2 app running from: $PM2_APP_PATH"
  echo ""
  
  # Check if .env exists in that directory
  if [ -f "$PM2_APP_PATH/.env" ]; then
    echo "✅ .env file found in $PM2_APP_PATH"
    echo "Contents:"
    cat "$PM2_APP_PATH/.env"
  else
    echo "❌ .env file NOT found in $PM2_APP_PATH"
  fi
  
  echo ""
  echo "Checking build directory..."
  if [ -d "$PM2_APP_PATH/build" ]; then
    echo "✅ build directory exists"
    echo "Checking if build/index.js has dotenv..."
    if grep -q "import dotenv from" "$PM2_APP_PATH/build/index.js" 2>/dev/null; then
      echo "✅ build/index.js has dotenv import"
    else
      echo "❌ build/index.js MISSING dotenv import"
      echo "This means you need to rebuild and redeploy!"
    fi
  else
    echo "❌ build directory NOT found"
  fi
EOF

echo ""
echo "======================================"
echo "What to do next:"
echo "======================================"
echo ""
echo "Option 1: Deploy to the correct directory"
echo "  1. Note the PM2_APP_PATH from above"
echo "  2. Update deploy.sh with the correct REMOTE_DIR"
echo "  3. Run: ./deploy.sh"
echo ""
echo "Option 2: Update PM2 to use the new directory"
echo "  1. ssh ${SERVER}"
echo "  2. cd /root/erc8004-mcp-server  # or wherever you want"
echo "  3. pm2 delete all"
echo "  4. pm2 start ecosystem.config.cjs"
echo "  5. pm2 save"
echo ""
