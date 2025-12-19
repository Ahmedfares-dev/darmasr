#!/bin/bash

# Script to set up MongoDB environment variables

MONGO_USER="hrpsi_admin"
MONGO_PASSWORD="yV0Ba58>&4£1"
MONGO_HOST="${MONGO_HOST:-localhost}"
MONGO_PORT="${MONGO_PORT:-27017}"
MONGO_DB="${MONGO_DB:-darmasr}"

# URL encode the password (handle special characters)
# > = %3E
# & = %26
# £ = %C2%A3
ENCODED_PASSWORD="yV0Ba58%3E%264%C2%A31"

echo "Setting up MongoDB connection string..."
echo ""

# Check if .env exists
if [ ! -f .env ]; then
    echo "Creating .env file from .env.example..."
    if [ -f .env.example ]; then
        cp .env.example .env
    else
        touch .env
    fi
fi

# Remove old MONGODB_URI if exists
sed -i.bak '/^MONGODB_URI=/d' .env 2>/dev/null || sed -i '/^MONGODB_URI=/d' .env

# Add new MONGODB_URI
echo "" >> .env
echo "# MongoDB Connection" >> .env
echo "MONGODB_URI=mongodb://${MONGO_USER}:${ENCODED_PASSWORD}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}" >> .env

echo "✅ MongoDB connection string added to .env file"
echo ""
echo "MONGODB_URI format:"
echo "mongodb://${MONGO_USER}:***@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}"
echo ""
echo "Note: Password has been URL-encoded for special characters"
echo ""
echo "To use a different host/port, set environment variables:"
echo "  MONGO_HOST=your-host MONGO_PORT=27017 MONGO_DB=darmasr ./setup-mongodb-env.sh"
echo ""
echo "You can now run:"
echo "  npm run check-env"
echo "  npm run seed:buildings"
