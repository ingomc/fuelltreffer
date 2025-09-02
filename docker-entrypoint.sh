#!/bin/sh

# Start backend in background
cd backend
PORT=3001 FRONTEND_URL=http://localhost:3000 node server.js &

# Start frontend server
cd /app/frontend
serve -s dist -p 3000

# Wait for any process to exit
wait