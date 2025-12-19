#!/bin/bash

# Quick status check script for PM2 processes

echo "🔍 Checking PM2 Processes Status..."
echo "=================================="
echo ""

# Check PM2 status
pm2 list

echo ""
echo "📊 Detailed Status:"
echo "-------------------"

# Get process info
API_STATUS=$(pm2 jlist | grep -A 20 '"name":"darmasr-api"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "not found")
CLIENT_STATUS=$(pm2 jlist | grep -A 20 '"name":"darmasr-client"' | grep -o '"status":"[^"]*"' | cut -d'"' -f4 || echo "not found")

echo ""
echo "Backend API (darmasr-api):"
if [ "$API_STATUS" = "online" ]; then
    echo "  ✅ Status: $API_STATUS"
    echo "  🌐 Health Check: http://localhost:5000/api/health"
else
    echo "  ❌ Status: $API_STATUS"
    echo "  💡 Run: pm2 logs darmasr-api --err"
fi

echo ""
echo "Frontend Client (darmasr-client):"
if [ "$CLIENT_STATUS" = "online" ]; then
    echo "  ✅ Status: $CLIENT_STATUS"
    echo "  🌐 Access: http://localhost:5173"
else
    echo "  ❌ Status: $CLIENT_STATUS"
    echo "  💡 Run: pm2 logs darmasr-client --err"
fi

echo ""
echo "=================================="

# Check if both are online
if [ "$API_STATUS" = "online" ] && [ "$CLIENT_STATUS" = "online" ]; then
    echo "✅ Both processes are running correctly!"
    echo ""
    echo "📍 Access Points:"
    echo "   Backend API: http://localhost:5000"
    echo "   Frontend:    http://localhost:5173"
    echo "   Health:      http://localhost:5000/api/health"
    echo ""
    exit 0
else
    echo "❌ Some processes are not running correctly!"
    echo ""
    echo "💡 Troubleshooting:"
    echo "   1. Check logs: npm run pm2:logs"
    echo "   2. Restart: npm run pm2:restart"
    echo "   3. Fix client: npm run fix-client"
    echo ""
    exit 1
fi
