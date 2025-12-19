#!/bin/bash

# DarMasr PM2 Startup Script
# This script ensures everything is ready before starting PM2

set -e

echo "🚀 Starting DarMasr Application..."
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo -e "${RED}❌ PM2 is not installed!${NC}"
    echo "Install it with: npm install -g pm2"
    exit 1
fi

echo -e "${GREEN}✅ PM2 is installed${NC}"

# Check if .env exists
if [ ! -f .env ]; then
    echo -e "${YELLOW}⚠️  .env file not found!${NC}"
    if [ -f .env.example ]; then
        echo "Copying .env.example to .env..."
        cp .env.example .env
        echo -e "${YELLOW}⚠️  Please edit .env file with your actual values!${NC}"
    else
        echo -e "${RED}❌ .env.example not found!${NC}"
        exit 1
    fi
fi

# Create logs directory
if [ ! -d logs ]; then
    echo "Creating logs directory..."
    mkdir -p logs
fi

# Check environment variables
echo ""
echo "Checking environment variables..."
if npm run check-env 2>&1 | grep -q "ERRORS FOUND"; then
    echo -e "${RED}❌ Environment variables check failed!${NC}"
    echo "Please fix your .env file and try again."
    exit 1
fi

echo -e "${GREEN}✅ Environment variables OK${NC}"

# Stop any existing processes
echo ""
echo "Stopping any existing PM2 processes..."
pm2 delete ecosystem.config.js 2>/dev/null || true

# Start PM2
echo ""
echo "Starting PM2 processes..."
npm run pm2:start

# Wait a moment for processes to start
sleep 3

# Verify processes
echo ""
echo "Verifying processes..."
if npm run verify-pm2 2>&1 | grep -q "Both processes are running correctly"; then
    echo ""
    echo -e "${GREEN}✅ Success! Both processes are running.${NC}"
    echo ""
    echo "📍 Access Points:"
    echo "   Backend API: http://localhost:5000"
    echo "   Frontend:    http://localhost:5173"
    echo "   Health Check: http://localhost:5000/api/health"
    echo ""
    echo "📊 Useful commands:"
    echo "   npm run pm2:status    - Check status"
    echo "   npm run pm2:logs      - View logs"
    echo "   npm run pm2:restart   - Restart processes"
    echo "   npm run verify-pm2    - Verify both processes"
    echo ""
else
    echo -e "${RED}❌ Verification failed! Check logs:${NC}"
    echo "   npm run pm2:logs"
    exit 1
fi
