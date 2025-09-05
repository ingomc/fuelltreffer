# Multi-stage build for Astro SSR application inspired by official Astro documentation

FROM node:lts AS base
WORKDIR /app

# By copying only the package.json and package-lock.json here, we ensure that the following `-deps` steps are independent of the source code.
# Therefore, the `-deps` steps will be skipped if only the source code changes.
COPY package.json package-lock.json ./

FROM base AS prod-deps
RUN npm ci --omit=dev --only=production

FROM base AS build-deps
RUN npm ci

FROM build-deps AS build
COPY . .
RUN npm run build

FROM base AS runtime
# Copy production dependencies
COPY --from=prod-deps /app/node_modules ./node_modules
# Copy built application
COPY --from=build /app/dist ./dist
# Copy .env file for dotenv loading
COPY --from=build /app/.env ./.env

# Set environment variables for proper host binding
ENV HOST=0.0.0.0
ENV PORT=4000

# Expose port
EXPOSE 4000

# Start Astro server directly
CMD ["node", "./dist/server/entry.mjs"]