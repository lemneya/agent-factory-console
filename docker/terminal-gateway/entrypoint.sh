#!/bin/bash
# AFC-1.5: Terminal Gateway Entrypoint
# Starts the gateway service with proper configuration

set -e

echo "AFC-1.5 Terminal Gateway Starting..."
echo "=================================="
echo "Terminal Enabled: ${TERMINAL_ENABLED:-false}"
echo "Default Mode: ${DEFAULT_MODE:-READ_ONLY}"
echo "Port: ${PORT:-7681}"
echo "=================================="

# Verify auth token is set (required for security)
if [ -z "$GATEWAY_AUTH_TOKEN" ]; then
    echo "WARNING: GATEWAY_AUTH_TOKEN is not set!"
    echo "The gateway will reject all authenticated requests."
fi

# Start the Node.js gateway application
exec node /app/gateway.js
