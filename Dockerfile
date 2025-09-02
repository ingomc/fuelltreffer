# Multi-stage build for Astro frontend and Express backend

# Stage 1: Build Astro frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app

# Copy frontend package files
COPY package*.json ./
RUN npm ci

# Copy frontend source
COPY . .

# Build Astro app
RUN npm run build

# Stage 2: Backend setup
FROM node:20-alpine AS backend-builder
WORKDIR /app/backend

# Copy backend package files
COPY backend/package*.json ./
RUN npm ci --only=production

# Stage 3: Production image
FROM node:20-alpine AS production
WORKDIR /app

# Install serve to serve the static frontend
RUN npm install -g serve

# Copy built frontend
COPY --from=frontend-builder /app/dist ./frontend/dist

# Copy backend
COPY --from=backend-builder /app/backend/node_modules ./backend/node_modules
COPY backend ./backend

# Copy startup script
COPY docker-entrypoint.sh ./
RUN chmod +x docker-entrypoint.sh

# Expose ports
EXPOSE 3000 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start both services
CMD ["./docker-entrypoint.sh"]