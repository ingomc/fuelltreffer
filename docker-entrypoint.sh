#!/bin/sh

# Start backend in background
cd backend
PORT=4001 FRONTEND_URL=http://localhost:4000 node server.js &

# Start frontend server
cd /app/frontend
serve -s dist -p 4000

# Wait for any process to exit
wait