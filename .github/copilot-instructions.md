# Fuelltreffer - LiveKit Dart Dashboard

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Architecture & Overview
Fuelltreffer is an Astro SSR frontend application with Svelte components that provides:
- Real-time communication via LiveKit integration
- Dart team management and statistics dashboard
- Streamer and viewer interfaces for live events
- 2k Software API integration for league data
- Docker deployment capability

## Working Effectively

### Bootstrap and Dependencies
- Copy environment template: `cp .env.example .env`
- Install dependencies: `npm install` -- takes 30 seconds. Set timeout to 60+ minutes for safety.
- Configure ports (optional): `bash setup-ports.sh` -- interactive script for port configuration

### Build and Development
- Type check: `npm run astro check` -- takes 6 seconds. NEVER CANCEL.
- Build for production: `npm run build` -- takes 12 seconds. NEVER CANCEL. Set timeout to 30+ minutes.
- Start development server: `FRONTEND_PORT=4321 npm run dev` -- starts in 550ms on configured port
- Preview production build: `npm run preview` -- starts immediately after build

### Code Quality
- Run linting: `npm run lint` -- takes 1.3 seconds
- Auto-fix linting issues: `npm run lint:fix`
- Always run `npm run lint` before committing changes or CI will fail
- Always run `npm run astro check` for TypeScript validation

### Environment Configuration
- Use `bash setup-ports.sh` to configure ports interactively:
  - Option 1: Development (Frontend: 4321, Backend: 4001) 
  - Option 2: Production/Docker (Frontend: 3000, Backend: 3001)
  - Option 3: Custom ports
- Environment variables are read from `.env` file
- To start dev server on custom port: `FRONTEND_PORT=XXXX npm run dev`

### Docker Deployment
**IMPORTANT**: Docker builds currently fail due to npm ci issues in container environment.
- Local Docker build: `docker build -t fuelltreffer .` -- **CURRENTLY FAILS**
- Docker Compose: `docker compose up --build` -- **CURRENTLY FAILS**
- Known issue: npm ci exits with "Exit handler never called" error in Docker
- Alternative: Use host-based builds and copy dist/ to containers

## Validation

### Manual Testing Scenarios
ALWAYS manually validate changes by testing these scenarios:
1. **Application startup**: Verify dev server starts and serves content
   - Run: `FRONTEND_PORT=4321 npm run dev`
   - Test: `curl -s -I http://localhost:4321/` should return HTTP 200
2. **Page accessibility**: Ensure all key pages load
   - Main dashboard: `curl -s -I http://localhost:4321/`
   - Streamer interface: `curl -s -I http://localhost:4321/streamer`
   - Viewer interface: `curl -s -I http://localhost:4321/viewer`
3. **Build validation**: Confirm production build works
   - Run: `npm run build && npm run preview`
   - Test: Application should be accessible on preview port

### Timeout Guidelines
- **npm install**: Set timeout to 60+ minutes. NEVER CANCEL builds.
- **npm run build**: Set timeout to 30+ minutes. Takes ~12 seconds normally.
- **npm run astro check**: Set timeout to 15+ minutes. Takes ~6 seconds normally.
- **Development server**: Usually starts in under 1 second.

### Before Committing
Always run these commands before making any commit:
1. `npm run lint` -- must pass without errors
2. `npm run astro check` -- must pass TypeScript validation
3. `npm run build` -- must build successfully
4. Test at least one manual validation scenario

## Common Tasks and File Locations

### Key Files
- `package.json` -- Scripts and dependencies
- `astro.config.mjs` -- Astro configuration with SSR mode
- `src/pages/` -- Application pages (index, streamer, viewer)
- `src/components/svelte/` -- Svelte components
- `src/components/svelte/livekit/` -- LiveKit integration components
- `.env` -- Environment variables (copy from .env.example)
- `Dockerfile` -- Docker configuration (currently has build issues)
- `setup-ports.sh` -- Port configuration utility

### Important Development Notes
- **SSR Mode**: Application uses Astro server-side rendering
- **Port Configuration**: Use environment variables or setup-ports.sh script
- **LiveKit Integration**: Real-time features require LiveKit configuration
- **Import Issues**: If you see import errors, check that all exported functions exist
- **Environment Loading**: Use explicit environment variables like `FRONTEND_PORT=4321 npm run dev`

### Repository Root Structure
```
.astro/           # Astro build cache
.env.example      # Environment template
.github/          # GitHub configuration
Dockerfile        # Docker build (currently broken)
README.md         # Project documentation
astro.config.mjs  # Astro configuration
docker-compose.yml # Docker Compose (currently broken)
eslint.config.js  # ESLint configuration
package.json      # Dependencies and scripts
public/           # Static assets
setup-ports.sh    # Port configuration utility
src/              # Source code
  components/     # Astro and Svelte components
  layouts/        # Page layouts
  pages/          # Application pages
  stores/         # Svelte stores
  types/          # TypeScript types
tailwind.config.mjs # TailwindCSS configuration
tsconfig.json     # TypeScript configuration
```

### Dependency Information
- **Runtime**: Node.js LTS required
- **Framework**: Astro v4.15+ with SSR
- **Frontend**: Svelte v5.38+ components
- **Styling**: TailwindCSS v3.4+
- **Real-time**: LiveKit Client SDK v2.15+
- **Development**: TypeScript v5.5+, ESLint v9.35+