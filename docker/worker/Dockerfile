# AFC-1.5: Worker Container Template
# Workers have tmux installed for terminal session attachment

FROM node:20-alpine

# Install tmux and bash for terminal sessions
RUN apk add --no-cache \
    tmux \
    bash \
    curl

# Create worker user (non-root)
RUN adduser -D -s /bin/bash worker

# Set up tmux configuration
COPY --chown=worker:worker tmux.conf /home/worker/.tmux.conf

WORKDIR /app

# Copy application files
COPY --chown=worker:worker package*.json ./
RUN npm install --production

COPY --chown=worker:worker . .

# Create data directory
RUN mkdir -p /app/data && chown worker:worker /app/data

# Run as non-root user
USER worker

# Health check
HEALTHCHECK --interval=30s --timeout=10s --retries=3 \
    CMD curl -f http://localhost:3000/health || exit 1

CMD ["node", "worker.js"]
