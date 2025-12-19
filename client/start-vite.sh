#!/bin/bash

# Vite startup script for PM2
# This ensures proper environment setup

# Get the directory where this script is located
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

# Export PATH to ensure node/npm are available
export PATH="$PATH:/usr/local/bin:/usr/bin:/bin:$HOME/.nvm/versions/node/*/bin"

# Find node executable
NODE_CMD=$(which node 2>/dev/null || command -v node 2>/dev/null || echo "node")

if [ -z "$NODE_CMD" ] || [ "$NODE_CMD" = "node" ]; then
    # Try common locations
    if [ -f "/usr/local/bin/node" ]; then
        NODE_CMD="/usr/local/bin/node"
    elif [ -f "/usr/bin/node" ]; then
        NODE_CMD="/usr/bin/node"
    fi
fi

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Error: node_modules not found in $SCRIPT_DIR"
    echo "Please run 'npm install' in the client directory first."
    exit 1
fi

# Check if vite is installed
VITE_BIN="$SCRIPT_DIR/node_modules/.bin/vite"
if [ ! -f "$VITE_BIN" ]; then
    echo "Error: Vite not found at $VITE_BIN"
    echo "Please run 'npm install' in the client directory first."
    exit 1
fi

# Set environment variables
export NODE_ENV=${NODE_ENV:-development}
export HOST=${HOST:-0.0.0.0}
export PORT=${PORT:-5173}

# Start Vite with explicit node path
exec "$NODE_CMD" "$VITE_BIN" --host "$HOST" --port "$PORT"
