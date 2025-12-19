#!/bin/bash

# Automated Nginx setup script for darmasrsharq.site

set -e

DOMAIN="darmasrsharq.site"
APP_DIR="/root/darmasr"

echo "🚀 Setting up Nginx for $DOMAIN"
echo "================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then 
    echo "❌ Please run as root (use sudo)"
    exit 1
fi

# Step 1: Install Nginx if not installed
if ! command -v nginx &> /dev/null; then
    echo "📦 Installing Nginx..."
    apt update
    apt install nginx -y
    systemctl enable nginx
    systemctl start nginx
else
    echo "✅ Nginx already installed"
fi

# Step 2: Build frontend
echo ""
echo "🔨 Building frontend..."
cd $APP_DIR
npm run build

if [ ! -d "$APP_DIR/client/dist" ]; then
    echo "❌ Frontend build failed!"
    exit 1
fi
echo "✅ Frontend built successfully"

# Step 3: Create Nginx config
echo ""
echo "📝 Creating Nginx configuration..."

cat > /etc/nginx/sites-available/$DOMAIN << 'EOF'
server {
    listen 80;
    listen [::]:80;
    server_name darmasrsharq.site www.darmasrsharq.site;

    access_log /var/log/nginx/darmasrsharq.site.access.log;
    error_log /var/log/nginx/darmasrsharq.site.error.log;

    client_max_body_size 10M;

    # Backend API
    location /api {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Frontend
    location / {
        root /root/darmasr/client/dist;
        try_files $uri $uri/ /index.html;
        index index.html;

        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }
}
EOF

echo "✅ Nginx config created"

# Step 4: Enable site
echo ""
echo "🔗 Enabling site..."
ln -sf /etc/nginx/sites-available/$DOMAIN /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Step 5: Test config
echo ""
echo "🧪 Testing Nginx configuration..."
nginx -t

if [ $? -ne 0 ]; then
    echo "❌ Nginx configuration test failed!"
    exit 1
fi

# Step 6: Reload Nginx
echo ""
echo "🔄 Reloading Nginx..."
systemctl reload nginx
echo "✅ Nginx reloaded"

# Step 7: Setup SSL
echo ""
echo "🔒 Setting up SSL with Let's Encrypt..."
echo "Would you like to setup SSL now? (y/n)"
read -r setup_ssl

if [ "$setup_ssl" = "y" ] || [ "$setup_ssl" = "Y" ]; then
    if ! command -v certbot &> /dev/null; then
        echo "📦 Installing Certbot..."
        apt install certbot python3-certbot-nginx -y
    fi
    
    echo ""
    echo "Running Certbot..."
    certbot --nginx -d $DOMAIN -d www.$DOMAIN
else
    echo "⚠️  SSL setup skipped. Run manually:"
    echo "   sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
fi

# Step 8: Configure firewall
echo ""
echo "🔥 Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 'Nginx Full'
    ufw allow 80/tcp
    ufw allow 443/tcp
    echo "✅ UFW configured"
fi

echo ""
echo "================================"
echo "✅ Setup Complete!"
echo "================================"
echo ""
echo "Your site should now be accessible at:"
echo "  http://$DOMAIN"
if [ "$setup_ssl" = "y" ] || [ "$setup_ssl" = "Y" ]; then
    echo "  https://$DOMAIN"
fi
echo ""
echo "Next steps:"
echo "1. Make sure PM2 is running: npm run verify-pm2"
echo "2. Test the site: curl http://$DOMAIN/api/health"
echo "3. Check logs: sudo tail -f /var/log/nginx/$DOMAIN.access.log"
echo ""
