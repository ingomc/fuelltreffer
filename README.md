# Fuelltreffer - 2k Software Dashboard

A modern Astro SSR application that provides a dashboard interface for 2k dart software APIs, specifically designed for Dokploy deployment.

The dashboard runs without LiveKit or a separate streaming server. Video, voice/text chat, viewer/streamer pages, and streamer authentication have been removed. Teams, schedules, match results, league tables, and statistics continue to use the 2k software API.

## 🚀 Architecture

- **Frontend & Backend**: Single Astro SSR application with built-in API routes
- **Server-Side Rendering**: Fast initial load with dynamic data fetching
- **API Proxy**: Internal Astro API routes proxy requests to 2k software backend
- **Deployment**: Docker container optimized for Dokploy

## ✨ Features

- 📊 Real-time team dashboard with participant data
- 📱 Fully responsive design (mobile-first)
- 🎯 Collapsible sections for organized data display
- 🔍 Advanced search functionality for different participants
- 📈 Match statistics and team member management
- 🔄 Server-side rendering for fast initial loads
- 🐳 Docker-ready for easy deployment
- 📍 Statically generated venue map for all current league teams at `/spielorte`

## 🛠 Tech Stack

- **Framework**: Astro 4.15+ with SSR
- **Adapter**: @astrojs/node for Node.js deployment
- **Styling**: Tailwind CSS
- **Language**: TypeScript
- **Container**: Docker with Node.js Alpine
- **Deployment**: Dokploy-optimized

## 📦 Installation

```bash
# Clone the repository
git clone <repository-url>
cd fuelltreffer

# Install dependencies
npm install

# Start development server
npm run dev
```

## 🔧 Configuration

Configuration is optional when using the default API. Copy `.env.example` to `.env` to customize local development or Compose settings:

```env
# Public domain for production Compose routing
APP_DOMAIN=darts.sc-oberfuellbach.de

# Local development / Compose host port
FRONTEND_PORT=4000

# 2k Software API
TWOK_SOFTWARE_API_URL=https://backend4.3k-darts.com/2k-backend4/api/v1/frontend

# Optional analytics; leave empty to disable
PUBLIC_UMAMI_URL=
PUBLIC_UMAMI_WEBSITE_ID=
```

The default team is `633505`; select another team with `/?team=632079`. Server containers receive `TWOK_SOFTWARE_API_URL` through their environment. If enabling Umami, provide its `PUBLIC_*` variables during the build; runtime variables alone do not update the compiled tracking script.

## 🏆 Saisonkonfiguration

Liga, Saison, Event-/Phasen-ID, Tabellenrunde, Standardteam und alle zehn Teams stehen zentral in `src/config/league.ts`. Die Spielortseite verwendet dieselbe Teamliste.

## 📍 Spielorte

`/spielorte` wird bei jedem Build als statisches HTML erzeugt: zehn Vereine, Adressen und eine interaktive Leaflet-/OpenStreetMap-Karte. API-Ausfälle verwenden den versionierten Ersatzdatenstand je Team. Koordinaten werden dauerhaft gespeichert; geänderte Adressen erhalten bis zur Prüfung keinen Marker. Im Browser werden keine 2k- oder Geocoding-Abfragen für die Karte ausgeführt.

Es sind keine neuen ENV-Variablen oder Dienste erforderlich. `TWOK_SOFTWARE_API_URL` muss für eine abweichende Datenquelle bereits beim Build verfügbar sein. Canonical- und Social-URLs verwenden die öffentliche Domain aus `astro.config.mjs`. Datenpflege, Quellen und Prüfungen stehen in [docs/spielorte.md](docs/spielorte.md).

## Link-Vorschauen

Startseite und Spielorte haben eigene Open-Graph-Texte und statische Vorschaubilder (1200 × 630 JPEG). Texte, Alt-Texte und Bildpfade stehen in `src/config/seo.ts`. Bildquellen und Hinweise zur Aktualisierung sind in [docs/open-graph.md](docs/open-graph.md) dokumentiert.

## 🚀 Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Type checking
npm run astro check

# Venue data tests (Node.js 22.6+)
npm test
```

## 🐳 Docker Deployment

### Local Testing

```bash
# Build Docker image
docker build -t fuelltreffer .

# Run container
docker run -p 4000:4000 fuelltreffer
```

### Docker Compose

```bash
# Start with docker-compose
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 🌐 Dokploy Deployment

1. **Point DNS** for `darts.sc-oberfuellbach.de` at the Dokploy server. Set its A record and either configure a matching AAAA record or remove AAAA if the server does not support IPv6.
2. **Connect this repository** to the existing Dokploy service.
3. **Configure routing**: when using `docker-compose.production.yml`, `APP_DOMAIN` controls the Traefik Host rule. When using Dokploy-managed domains, configure host `darts.sc-oberfuellbach.de`, path `/`, container port `4000`, HTTPS, and Let's Encrypt in Dokploy instead. Compose deployments must be redeployed after domain changes.
4. **Set environment variables** as shown below. No streaming credentials are required.
5. **Build and deploy**. Verify `/health`, team selection, matches, league tables, and match reports under the new HTTPS domain.

### Dokploy Environment Variables

```env
NODE_ENV=production
APP_DOMAIN=darts.sc-oberfuellbach.de
HOST=0.0.0.0
PORT=4000
TWOK_SOFTWARE_API_URL=https://backend4.3k-darts.com/2k-backend4/api/v1/frontend
```

`APP_DOMAIN` is a Compose interpolation variable, not an application runtime setting. Public canonical/social URLs use `site` in `astro.config.mjs`; request URLs still depend on proxy headers. Keep the public Host and HTTPS protocol intact at the proxy. No `ORIGIN` variable is required.

Remove obsolete deployment variables: `LIVEKIT_*`, `PUBLIC_LIVEKIT_*`, `RTMP_URL`, `WHIP_URL`, `STREAMER_EMAIL`, and `STREAMER_PASSWORD`. The Docker image no longer copies or requires a runtime `.env` file. `/viewer`, `/streamer`, `/api/auth`, and `/api/livekit/token` are removed and return 404.

Production Compose can also be started manually with `docker compose -f docker-compose.production.yml up -d --build` on a server with the existing `dokploy-network`.

## 📁 Project Structure

```
fuelltreffer/
├── src/
│   ├── components/
│   │   └── ParticipantData.astro    # Main dashboard component
│   ├── layouts/
│   │   └── Layout.astro             # Base page layout
│   ├── pages/
│   │   ├── index.astro              # Homepage
│   │   └── api/
│   │       └── participant/
│   │           └── [id].js          # API route for participant data
│   └── types/
│       └── api.ts                   # TypeScript type definitions
├── astro.config.mjs                 # Astro configuration (SSR mode)
├── Dockerfile                       # Multi-stage Docker build
├── docker-compose.yml               # Simplified container setup
└── package.json                     # Dependencies and scripts
```

## 🔗 API Endpoints

### Internal API Routes

- `GET /api/participant/{id}` - Fetch participant data
  - Proxies to: `{CURRENT_LEAGUE.api.twokSoftwareBaseUrl}/participant/{id}`
  - Returns: Complete participant data with team info and matches

### Frontend Routes

- `/` - Main dashboard with auto-loaded participant data
- `/spielorte` - Statically generated league venues with an OpenStreetMap overview

## 🧪 Testing League Data

Die aktuelle Standard-ID und alle verfügbaren Teams stehen in
`src/config/league.ts` unter `CURRENT_LEAGUE`.

## 🔍 Features Overview

### Dashboard Sections

1. **Participant Information** - Personal details and status
2. **Team Information** - Team details and playing venue
3. **Matches** - Schedule, results, and statistics
4. **Team Members** - Complete team roster with status
5. **Raw Data** - JSON output for debugging

### Responsive Design

- Mobile-first approach
- Collapsible sections for better mobile UX
- Responsive tables that convert to cards on mobile
- Touch-friendly interface elements

## 🐛 Troubleshooting

### Build Issues

```bash
# Clear node modules and reinstall
rm -rf node_modules package-lock.json
npm install

# Check for TypeScript errors
npm run astro check
```

### Docker Issues

```bash
# Check container logs
docker logs <container-id>

# Debug inside container
docker exec -it <container-id> sh
```

### API Connection Issues

- Verify the API URLs in `src/config/league.ts`
- Check network connectivity to 2k software backend
- Monitor browser console for JavaScript errors

## 📝 Development Notes

- SSR enabled for fast initial loads
- API routes handle server-side data fetching
- Client-side JavaScript handles interactivity
- TypeScript provides type safety
- Environment variables configure different deployments

## 🎯 Performance

- Server-side rendering for optimal initial load
- Minimal JavaScript bundle size
- Efficient API proxy with error handling
- Docker image optimized for production

## 🔄 Migration from Dual-Service Architecture

This project was converted from a dual-service architecture (Astro static + Express backend) to a single Astro SSR application:

### Before
- Separate Astro frontend (static)
- Separate Express.js backend
- Client-side API calls to external backend
- Complex Docker setup with multiple services

### After  
- Single Astro SSR application
- Built-in API routes replace Express backend
- Server-side rendering with initial data loading
- Simplified Docker deployment

### Benefits
- Reduced deployment complexity
- Better performance with SSR
- Simplified development workflow
- Single service to maintain

---

**Built with Astro SSR for Dokploy deployment** 🚀
