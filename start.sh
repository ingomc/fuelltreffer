#!/bin/sh
# Start script for Astro SSR with proper host binding

echo "Starting Astro SSR server on 0.0.0.0:4000"

# Set environment variables
export HOST=0.0.0.0
export PORT=4000

# Patch the Astro server file to bind to 0.0.0.0
sed -i 's/localhost/0.0.0.0/g' ./dist/server/entry.mjs 2>/dev/null || true
sed -i 's/127\.0\.0\.1/0.0.0.0/g' ./dist/server/entry.mjs 2>/dev/null || true

# Start the Astro server
exec node ./dist/server/entry.mjs
