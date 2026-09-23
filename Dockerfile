# Production Dockerfile for Watch Club Trusted Backend API (Cloud Run)
FROM node:22-alpine AS builder

WORKDIR /app

# Install dependencies first for optimal Docker caching
COPY package*.json ./
RUN npm ci

# Copy source code and build
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=8080

# Install dumb-init for proper PID 1 signal forwarding (graceful SIGTERM/SIGINT)
RUN apk add --no-cache dumb-init

# Copy built distribution and dependencies
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public

# Ensure uploads directory exists with correct permissions
RUN mkdir -p /app/public/uploads && chown -R node:node /app

# Run as non-root user
USER node

EXPOSE 8080

ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "dist/server.cjs"]
