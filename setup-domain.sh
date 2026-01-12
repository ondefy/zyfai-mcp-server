#!/bin/bash

# Domain Setup Script for mcp.zyf.ai
# Run this on your Digital Ocean droplet

set -e

DOMAIN="mcp.zyf.ai"
MCP_PORT=3005

echo "============================================================"
echo "🌐 Setting up domain: $DOMAIN"
echo "============================================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "⚠️  This script needs to be run as root"
    echo "Please run: sudo bash setup-domain.sh"
    exit 1
fi

echo "1️⃣  Checking nginx installation..."
if ! command -v nginx &> /dev/null; then
    echo "   Installing nginx..."
    apt update
    apt install nginx -y
else
    echo "   ✅ Nginx is already installed"
fi

echo ""
echo "2️⃣  Checking existing configurations..."
if [ -f /etc/nginx/sites-available/staging-defiapi.zyf.ai ]; then
    echo "   ✅ Found existing staging-defiapi.zyf.ai config (will be preserved)"
fi

if [ -f /etc/nginx/sites-available/$DOMAIN ]; then
    echo "   ⚠️  mcp.zyf.ai config already exists, backing up..."
    cp /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-available/$DOMAIN.backup.$(date +%Y%m%d_%H%M%S)
fi

echo ""
echo "3️⃣  Creating nginx configuration for $DOMAIN..."
cat > /etc/nginx/sites-available/$DOMAIN <<EOF
server {
    listen 80;
    server_name $DOMAIN;

    # Logging
    access_log /var/log/nginx/mcp-access.log;
    error_log /var/log/nginx/mcp-error.log;

    # Increase timeouts for SSE connections
    proxy_read_timeout 300s;
    proxy_connect_timeout 75s;
    proxy_send_timeout 300s;

    # SSE endpoint
    location /sse {
        proxy_pass http://localhost:$MCP_PORT/sse;
        proxy_http_version 1.1;
        
        # SSE specific headers
        proxy_set_header Connection '';
        proxy_set_header Cache-Control 'no-cache';
        proxy_set_header X-Accel-Buffering 'no';
        
        # Standard proxy headers
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Disable buffering for SSE
        proxy_buffering off;
        proxy_cache off;
    }

    # Messages endpoint
    location /messages {
        proxy_pass http://localhost:$MCP_PORT/messages;
        proxy_http_version 1.1;
        
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        
        # Allow large request bodies
        client_max_body_size 10M;
    }

    # Health and root endpoints
    location / {
        proxy_pass http://localhost:$MCP_PORT;
        proxy_http_version 1.1;
        
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
    }
}
EOF

echo ""
echo "4️⃣  Enabling site..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/

# Only remove default nginx site if no other configs exist
if [ -f /etc/nginx/sites-enabled/default ] && [ ! -f /etc/nginx/sites-enabled/staging-defiapi.zyf.ai ]; then
    echo "   Removing default nginx site..."
    rm /etc/nginx/sites-enabled/default
else
    echo "   ✅ Keeping existing configurations"
fi

echo ""
echo "5️⃣  Testing nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx configuration is valid"
else
    echo "❌ Nginx configuration has errors"
    exit 1
fi

echo ""
echo "6️⃣  Starting/restarting nginx..."
systemctl enable nginx
systemctl restart nginx

echo ""
echo "7️⃣  Configuring firewall (if needed)..."
if ufw status | grep -q "80/tcp"; then
    echo "   ✅ Port 80 already allowed"
else
    ufw allow 80/tcp
fi

if ufw status | grep -q "443/tcp"; then
    echo "   ✅ Port 443 already allowed"
else
    ufw allow 443/tcp
fi

ufw reload

echo ""
echo "8️⃣  Verifying MCP server is running..."
if pm2 list | grep -q "zyfai-mcp-server"; then
    echo "✅ MCP server is running"
else
    echo "⚠️  Warning: MCP server doesn't appear to be running"
    echo "   Start it with: pm2 start ecosystem.config.cjs"
fi

echo ""
echo "9️⃣  Verifying existing services..."
if curl -s http://localhost:3003 > /dev/null 2>&1; then
    echo "   ✅ Port 3003 (staging API) is accessible"
else
    echo "   ⚠️  Warning: Port 3003 not responding (staging API may be down)"
fi

if curl -s http://localhost:$MCP_PORT/health > /dev/null 2>&1; then
    echo "   ✅ Port $MCP_PORT (MCP server) is accessible"
else
    echo "   ⚠️  Warning: Port $MCP_PORT not responding (MCP server may be down)"
fi

echo ""
echo "============================================================"
echo "✅ Domain setup complete!"
echo "============================================================"
echo ""
echo "📋 Summary:"
echo ""
echo "   ✅ mcp.zyf.ai → localhost:$MCP_PORT (MCP Server)"
echo "   ✅ staging-defiapi.zyf.ai → localhost:3003 (Existing API - preserved)"
echo ""
echo "📋 Next steps:"
echo ""
echo "1. Configure DNS in Cloudflare:"
echo "   - Add A record: mcp → 159.89.19.102"
echo "   - Enable proxy (orange cloud) for SSL"
echo "   - staging-defiapi.zyf.ai should already be configured"
echo ""
echo "2. Test the new domain:"
echo "   curl http://$DOMAIN/health"
echo ""
echo "3. Verify existing domain still works:"
echo "   curl https://staging-defiapi.zyf.ai/"
echo ""
echo "4. (Optional) Set up Let's Encrypt SSL for mcp.zyf.ai:"
echo "   certbot --nginx -d $DOMAIN"
echo ""
echo "5. Update Claude Desktop config:"
echo "   Use: https://$DOMAIN/sse"
echo ""
