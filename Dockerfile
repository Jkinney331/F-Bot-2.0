# F-Bot 2.0 Dockerfile
# Multi-stage build for production optimization

# Stage 1: Build Stage
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Install build dependencies
RUN apk add --no-cache \
    python3 \
    py3-pip \
    make \
    g++ \
    git \
    curl

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production && npm cache clean --force

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Stage 2: Production Stage
FROM node:18-alpine AS production

# Install security updates
RUN apk update && apk upgrade && apk add --no-cache \
    dumb-init \
    curl \
    ca-certificates \
    && rm -rf /var/cache/apk/*

# Create non-root user for security
RUN addgroup -g 1001 -S nodejs \
    && adduser -S fbot -u 1001 -G nodejs

# Set working directory
WORKDIR /app

# Copy built application from builder stage
COPY --from=builder --chown=fbot:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=fbot:nodejs /app/src ./src
COPY --from=builder --chown=fbot:nodejs /app/flowise-config ./flowise-config
COPY --from=builder --chown=fbot:nodejs /app/deployment ./deployment
COPY --from=builder --chown=fbot:nodejs /app/package*.json ./

# Create necessary directories
RUN mkdir -p /app/logs /app/temp /app/uploads \
    && chown -R fbot:nodejs /app

# Copy health check script
COPY --chown=fbot:nodejs scripts/health-check.js ./scripts/

# Switch to non-root user
USER fbot

# Expose port
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
    CMD node scripts/health-check.js

# Set environment variables
ENV NODE_ENV=production
ENV PORT=3000
ENV HOST=0.0.0.0

# Use dumb-init to handle signals properly
ENTRYPOINT ["dumb-init", "--"]

# Start the application
CMD ["npm", "start"]

# Metadata
LABEL maintainer="F-Bot Development Team <dev@fbot.ai>"
LABEL version="2.0.0"
LABEL description="F-Bot 2.0 - Enhanced Fascia AI Chatbot with HIPAA compliance"
LABEL org.opencontainers.image.title="F-Bot 2.0"
LABEL org.opencontainers.image.description="HIPAA-compliant AI chatbot for fascia health"
LABEL org.opencontainers.image.version="2.0.0"
LABEL org.opencontainers.image.source="https://github.com/Jkinney331/F-Bot-2.0"
LABEL org.opencontainers.image.licenses="MIT" 