# Single-stage build for Astro SSR application

FROM node:20-alpine AS builder
WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci

# Copy source code
COPY . .

# Build Astro SSR app
RUN npm run build

# Production stage
FROM node:20-alpine AS production
WORKDIR /app

# Copy built application and start script
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY start.sh ./start.sh

# Make start script executable
RUN chmod +x ./start.sh

# Expose port
EXPOSE 4000

# Health check - wichtig für Dokploy Health Monitoring
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://0.0.0.0:4000/ || exit 1

# Set environment variables for proper host binding
ENV HOST=0.0.0.0
ENV PORT=4000

# Start Astro SSR server with explicit host binding
CMD ["./start.sh"]