#!/bin/bash

# Fuelltreffer Port Configuration Script
# Setzt alle Ports einheitlich für Development oder Production

echo "🚀 Fuelltreffer Port Configuration"
echo "=================================="
echo ""
echo "Aktuelle .env Konfiguration:"
if [ -f .env ]; then
    cat .env
else
    echo "Keine .env Datei gefunden - erstelle Standardkonfiguration..."
fi
echo ""

# Frage nach Development oder Production Setup
echo "Wähle Setup-Modus:"
echo "1) Development (Frontend: 4321, Backend: 4001)"
echo "2) Production/Docker (Frontend: 3000, Backend: 3001)"
echo "3) Custom Ports"
read -p "Eingabe (1-3): " choice

case $choice in
    1)
        FRONTEND_PORT=4321
        BACKEND_PORT=4001
        FRONTEND_URL="http://localhost:4321"
        BACKEND_URL="http://localhost:4001"
        echo "📋 Development Setup gewählt"
        ;;
    2)
        FRONTEND_PORT=3000
        BACKEND_PORT=3001
        FRONTEND_URL="http://localhost:3000"
        BACKEND_URL="http://localhost:3001"
        echo "📋 Production Setup gewählt"
        ;;
    3)
        read -p "Frontend Port: " FRONTEND_PORT
        read -p "Backend Port: " BACKEND_PORT
        FRONTEND_URL="http://localhost:$FRONTEND_PORT"
        BACKEND_URL="http://localhost:$BACKEND_PORT"
        echo "📋 Custom Setup gewählt"
        ;;
    *)
        echo "❌ Ungültige Eingabe - verwende Development Setup"
        FRONTEND_PORT=4321
        BACKEND_PORT=4001
        FRONTEND_URL="http://localhost:4321"
        BACKEND_URL="http://localhost:4001"
        ;;
esac

# Schreibe .env Datei
cat > .env << EOF
# Fuelltreffer Port Configuration
# Generated on $(date)

# Frontend Configuration
FRONTEND_PORT=$FRONTEND_PORT
FRONTEND_URL=$FRONTEND_URL

# Backend Configuration  
BACKEND_PORT=$BACKEND_PORT
BACKEND_URL=$BACKEND_URL

# Astro Public Variables (available in frontend)
PUBLIC_BACKEND_URL=$BACKEND_URL
PUBLIC_DEFAULT_PARTICIPANT_ID=308868
EOF

# Schreibe backend/.env
mkdir -p backend
cat > backend/.env << EOF
# Backend Environment Variables
PORT=$BACKEND_PORT
FRONTEND_URL=$FRONTEND_URL
EOF

echo ""
echo "✅ Konfiguration gespeichert:"
echo "   Frontend: $FRONTEND_URL"
echo "   Backend:  $BACKEND_URL"
echo ""
echo "📁 Dateien aktualisiert:"
echo "   .env"
echo "   backend/.env"
echo ""
echo "🚀 Starte Services mit: npm run dev:all"
echo "🐳 Docker Build mit: docker compose up --build"