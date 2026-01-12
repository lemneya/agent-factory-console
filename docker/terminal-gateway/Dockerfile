# AFC-1.5: Terminal Gateway Service
# Provides secure, authenticated access to worker terminal sessions
# DO NOT expose ttyd directly to internet; route via this gateway

FROM alpine:3.19

# Install dependencies
RUN apk add --no-cache \
    ttyd \
    tmux \
    curl \
    bash \
    nodejs \
    npm \
    openssl

# Create gateway user (non-root)
RUN adduser -D -s /bin/bash gateway

# Create log directory
RUN mkdir -p /var/log/terminal-gateway && \
    chown gateway:gateway /var/log/terminal-gateway

# Copy gateway application
WORKDIR /app
COPY package.json ./
COPY gateway.js ./
COPY entrypoint.sh ./

# Install Node.js dependencies
RUN npm install --production && \
    chown -R gateway:gateway /app

# Make entrypoint executable
RUN chmod +x /app/entrypoint.sh

# Expose gateway port (NOT ttyd directly)
EXPOSE 7681

# Health check endpoint
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:7681/health || exit 1

# Run as non-root user
USER gateway

ENTRYPOINT ["/app/entrypoint.sh"]
