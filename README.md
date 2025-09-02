# Fuelltreffer - 2k Software Dashboard

A modern Astro SSR application that provides a dashboard interface for 2k dart software APIs, specifically designed for Dokploy deployment.

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

Create a `.env` file:

```env
# Port configuration
FRONTEND_PORT=4000

# 2k Software API
TWOK_SOFTWARE_API_URL=https://backend4.2k-dart-software.com/2k-backend4/api/v1/frontend

# Default participant for testing
DEFAULT_PARTICIPANT_ID=308868
```

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
```

## 🐳 Docker Deployment

### Local Testing

```bash
# Build Docker image
docker build -t fuelltreffer .

# Run container
docker run -p 4000:4000 \
  -e TWOK_SOFTWARE_API_URL=https://backend4.2k-dart-software.com/2k-backend4/api/v1/frontend \
  fuelltreffer
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

1. **Create new project** in Dokploy
2. **Connect Git repository**
3. **Configure environment variables**:
   - `TWOK_SOFTWARE_API_URL`: Your 2k software API URL
   - `FRONTEND_PORT`: 4000 (default)
4. **Deploy** using the included Dockerfile

### Dokploy Environment Variables

```env
NODE_ENV=production
TWOK_SOFTWARE_API_URL=https://backend4.2k-dart-software.com/2k-backend4/api/v1/frontend
FRONTEND_PORT=4000
```

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
├── Dockerfile                       # Single-stage Docker build
├── docker-compose.yml               # Simplified container setup
└── package.json                     # Dependencies and scripts
```

## 🔗 API Endpoints

### Internal API Routes

- `GET /api/participant/{id}` - Fetch participant data
  - Proxies to: `{TWOK_SOFTWARE_API_URL}/participant/{id}`
  - Returns: Complete participant data with team info and matches

### Frontend Routes

- `/` - Main dashboard with auto-loaded participant data

## 🧪 Testing Known Participant IDs

- `308868` (default)
- `308860`, `308859`, `308865`
- `308863`, `308866`, `308864`, `308862`

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

- Verify `TWOK_SOFTWARE_API_URL` environment variable
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