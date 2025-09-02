# Fuelltreffer

Ein Astro Frontend mit Express.js Backend, das als Proxy für die 2k Software API dient. Optimiert für Deployment auf Dokploy.

## 🚀 Architektur

- **Frontend**: Astro (statisch) mit Client-side Fetching
- **Backend**: Express.js API Proxy Server  
- **Deployment**: Docker Container für Dokploy

## 📋 Features

- ✅ Astro Frontend mit Tailwind CSS
- ✅ Express.js Backend API Proxy
- ✅ Client-side Data Fetching (kein SSR)
- ✅ Docker Setup für einfaches Deployment
- ✅ CORS-konfiguiert für sichere API-Calls
- ✅ Fehlerbehandlung und Loading States
- ✅ TypeScript Support

## 🛠️ Entwicklung

### Voraussetzungen

- Node.js 20+
- npm

### Port-Konfiguration

**Einfach:** Nutze das Setup-Script für einheitliche Port-Verwaltung:

```bash
./setup-ports.sh
```

Wähle zwischen:
- **Development:** Frontend 4321, Backend 4001
- **Production:** Frontend 3000, Backend 3001  
- **Custom:** Eigene Ports definieren

**Manuell:** Ports in `.env` Datei setzen:

```bash
# .env
FRONTEND_PORT=4321
BACKEND_PORT=4001
FRONTEND_URL=http://localhost:4321
BACKEND_URL=http://localhost:4001
PUBLIC_BACKEND_URL=http://localhost:4001
```

### Installation

```bash
# Hauptprojekt Dependencies
npm install

# Backend Dependencies  
cd backend && npm install
```

### Entwicklung starten

```bash
# Beide Services gleichzeitig starten
npm run dev:all

# Oder einzeln:
npm run dev          # Frontend (Port aus .env)
npm run dev:backend  # Backend (Port aus .env)
```

### URLs

- Frontend: http://localhost:${FRONTEND_PORT}
- Backend API: http://localhost:${BACKEND_PORT}
- Health Check: http://localhost:${BACKEND_PORT}/health

## 🐳 Docker Deployment

### Lokal testen

```bash
# Docker Image bauen
docker build -t fuelltreffer .

# Container starten
docker run -p 3000:3000 -p 3001:3001 fuelltreffer

# Oder mit Docker Compose
docker-compose up --build
```

### Für Dokploy

1. Repository auf Dokploy verlinken
2. Build Command: `docker build -t fuelltreffer .`
3. Ports: 3000 (Frontend), 3001 (Backend)
4. Environment Variables nach Bedarf setzen

## 📡 API Endpoints

### Backend Proxy

- `GET /api/participant/:id` - Teilnehmer Daten laden
- `GET /api/proxy/*` - Allgemeine Proxy-Anfragen
- `GET /health` - Health Check

### Beispiel API Call

```javascript
// Teilnehmer 308868 laden
const response = await fetch('http://localhost:3001/api/participant/308868');
const data = await response.json();
```

## 🔧 Konfiguration

### Port-Management

Alle Ports werden zentral über Environment Variables verwaltet:

```bash
# Development (.env)
FRONTEND_PORT=4321
BACKEND_PORT=4001
PUBLIC_BACKEND_URL=http://localhost:4001

# Production (docker-compose.yml oder Dokploy)
FRONTEND_PORT=3000
BACKEND_PORT=3001
PUBLIC_BACKEND_URL=https://your-domain.com:3001
```

**Setup-Script verwenden:**
```bash
./setup-ports.sh  # Interaktive Port-Konfiguration
```

### Environment Variables (Backend)

```bash
# backend/.env
PORT=4001                          # Backend Server Port
FRONTEND_URL=http://localhost:4321  # CORS Origin

# Für Production
FRONTEND_URL=https://your-domain.com
```

## 📁 Projekt Struktur

```
fuelltreffer/
├── src/                    # Astro Frontend
│   ├── layouts/
│   ├── pages/
│   └── components/
├── backend/                # Express.js Backend
│   ├── server.js
│   └── package.json
├── Dockerfile             # Multi-stage Docker Build
├── docker-compose.yml     # Lokale Container Orchestrierung
└── package.json           # Hauptprojekt Dependencies
```

## 🚀 Production Deployment

Das Projekt ist für Dokploy optimiert:

1. **Single Container**: Frontend und Backend in einem Docker Image
2. **Health Checks**: Automatische Überwachung der Services
3. **Port Mapping**: 3000 (Frontend), 3001 (Backend API)
4. **Environment Configuration**: Einfache Konfiguration über Umgebungsvariablen

### Für Dokploy

1. Repository verknüpfen
2. **Environment Variables setzen:**
   ```
   FRONTEND_PORT=3000
   BACKEND_PORT=3001
   FRONTEND_URL=https://your-domain.com
   BACKEND_URL=https://your-domain.com:3001
   PUBLIC_BACKEND_URL=https://your-domain.com:3001
   ```
3. Dockerfile deployment wählen
4. Ports konfigurieren: `${FRONTEND_PORT}:3000,${BACKEND_PORT}:3001`
5. Domain auf Frontend Port zeigen lassen

## 🔍 Troubleshooting

### CORS Errors
- Backend CORS ist für `http://localhost:4321` (dev) konfiguriert
- Für Production: `FRONTEND_URL` Environment Variable setzen

### API Timeouts
- Standard Timeout: 10 Sekunden
- Bei langsamen Verbindungen in `backend/server.js` anpassen

### Docker Build Issues
- Multi-stage Build benötigt Node.js 20+
- Bei Problemen: `docker system prune` ausführen

## 📝 TODO

- [ ] Bessere UI für Teilnehmer-Daten
- [ ] Authentifizierung hinzufügen
- [ ] Caching für API-Anfragen
- [ ] Monitoring und Logging
- [ ] Tests schreiben