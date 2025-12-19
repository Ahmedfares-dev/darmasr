#!/bin/bash

# Fix script for client PM2 issues

echo "🔧 Fixing client PM2 configuration..."

# Navigate to project root
cd "$(dirname "$0")"

# 1. Make sure client dependencies are installed
echo "📦 Checking client dependencies..."
if [ ! -d "client/node_modules" ]; then
    echo "Installing client dependencies..."
    cd client
    npm install
    cd ..
else
    echo "✅ Client dependencies found"
fi

# 2. Make scripts executable
echo "🔐 Making scripts executable..."
chmod +x client/start-vite.sh
chmod +x start.sh
chmod +x server/scripts/*.js

# 3. Check if vite is available
echo "🔍 Checking Vite installation..."
if [ ! -f "client/node_modules/.bin/vite" ]; then
    echo "❌ Vite not found! Installing..."
    cd client
    npm install vite
    cd ..
fi

# 4. Test if vite can run
echo "🧪 Testing Vite..."
cd client
if node_modules/.bin/vite --version > /dev/null 2>&1; then
    echo "✅ Vite is working"
else
    echo "❌ Vite test failed. Reinstalling..."
    npm install
fi
cd ..

# 5. Stop any existing PM2 processes
echo "🛑 Stopping existing PM2 processes..."
pm2 delete darmasr-client 2>/dev/null || true
pm2 delete darmasr-api 2>/dev/null || true

echo ""
echo "✅ Fix complete! You can now run:"
echo "   npm run pm2:start"
echo ""
