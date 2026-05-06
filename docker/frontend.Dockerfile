# ================================================================
# LearnHub — Frontend Dockerfile (Multi-stage build)
# Build Angular app, serve via Nginx
# ================================================================

# --- Stage 1: Build ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY frontend/package*.json ./
RUN npm ci && npm cache clean --force

COPY frontend/ .
RUN npm run build -- --configuration=production

# --- Stage 2: Serve with Nginx ---
FROM nginx:1.25-alpine AS production

# Remove default Nginx config
RUN rm /etc/nginx/conf.d/default.conf

# Copy custom Nginx config for SPA routing
COPY docker/nginx/frontend.conf /etc/nginx/conf.d/default.conf

# Copy built Angular app
COPY --from=builder /app/dist/frontend/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
