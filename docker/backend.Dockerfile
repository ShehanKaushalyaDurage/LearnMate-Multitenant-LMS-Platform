# ================================================================
# LearnHub — Backend Dockerfile (Multi-stage build)
# ================================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files and prisma schemas
COPY backend/package*.json ./backend/
COPY prisma/ ./prisma/

# Install ALL dependencies (including devDependencies for build tools)
WORKDIR /app/backend
RUN npm ci && npm cache clean --force

# Symlink node_modules to root /app/ so Prisma can resolve @prisma/client
RUN ln -s /app/backend/node_modules /app/node_modules

# Generate Prisma clients
RUN npx prisma generate --schema=../prisma/master/schema.prisma
RUN npx prisma generate --schema=../prisma/tenant/schema.prisma

# Copy source and build
COPY backend/ .
RUN npm run build

# --- Stage 2: Production ---
FROM node:20-alpine AS production

WORKDIR /app

# Create non-root user
RUN addgroup -g 1001 -S learnhub && \
    adduser -S learnhub -u 1001

# Install production-only deps
COPY backend/package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

# Copy compiled application and generated Prisma clients
COPY --from=builder /app/backend/dist ./dist
COPY --from=builder /app/backend/generated ./generated

# Copy ONLY the tenant migration SQL files — no schemas, no config files needed
COPY --from=builder /app/prisma/tenant/migrations ./prisma/tenant/migrations

ENV NODE_ENV=production
ENV PORT=3000

USER learnhub

EXPOSE 3000

CMD ["node", "dist/main.js"]
