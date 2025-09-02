#!/bin/sh
# Start script for Astro SSR with proper host binding

echo "Starting Astro SSR server on 0.0.0.0:4000"
export HOST=0.0.0.0
export PORT=4000

# Start the Astro server
exec node ./dist/server/entry.mjs
