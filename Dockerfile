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

# Copy built application and scripts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./
COPY --from=builder /app/node_modules ./node_modules
COPY start.sh ./start.sh
COPY server-wrapper.js ./server-wrapper.js

# Make start script executable
RUN chmod +x ./start.sh

# Expose port
EXPOSE 4000

# Set environment variables for proper host binding
ENV HOST=0.0.0.0
ENV PORT=4000

# Start with Node.js wrapper that forces 0.0.0.0 binding
CMD ["node", "server-wrapper.js"]