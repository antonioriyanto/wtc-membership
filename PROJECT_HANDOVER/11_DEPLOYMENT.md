# DEPLOYMENT & PRODUCTION RUNTIME
**Document**: `PROJECT_HANDOVER/11_DEPLOYMENT.md`  
**Generated**: 2026-09-21T19:32:00-07:00

## 1. Production Build & Execution Commands

### Prerequisites
* Node.js v20+ or v22+
* npm v10+

### Step-by-Step Production Deployment

```bash
# 1. Install all production dependencies
npm install

# 2. Compile frontend and backend bundles
npm run build

# 3. Launch production server
npm run start
```

* **Build Output**:
  * Frontend assets: `/dist/` (HTML, CSS, chunked JS, assets).
  * Backend bundle: `/dist/server.cjs` (Single bundled CommonJS file resolved with sourcemaps).

---

## 2. Dockerfile Specification (Recommended Containerization)

```dockerfile
# Multi-stage Dockerfile for Watch Club Loyalty System
FROM node:22-alpine AS builder
WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy source and build
COPY . .
RUN npm run build

# Production runtime stage
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3000

COPY --from=builder /app/package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/public ./public
COPY --from=builder /app/data ./data

EXPOSE 3000
CMD ["node", "dist/server.cjs"]
```

---

## 3. Production Healthcheck

* **Endpoint**: `GET /api/health`
* **Expected Code**: `200 OK`
* **Response Payload**: `{"status": "ok"}`
