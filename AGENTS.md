# Repository Guidelines

## Project Structure & Module Organization

Fuelltreffer is an Astro SSR dashboard for 2k dart software, with Svelte components and Tailwind CSS.

- `src/pages/`: Astro pages and API proxies. Dynamic routes use bracketed parameters: `[eventId]/[matchId].js`.
- `src/components/`: shared Astro components; `svelte/` contains the interactive dashboard UI.
- `src/config/league.ts`: current season and teams. `src/data/`, `src/lib/venue-data.ts`, and `src/scripts/venue-map.ts` supply the prerendered `/spielorte` page; `scripts/` contains manual data maintenance.
- `src/layouts/`, `src/stores/`, `src/utils/`, and `src/types/api.ts`: page layout, shared state, helpers, and API types.
- `public/`: directly served assets; `src/assets/`: imported images; `docs/`: implementation notes.
- Root files configure builds, linting, and Docker.

## Build, Test, and Development Commands

- `npm ci`: install dependencies from `package-lock.json`.
- `npm run dev`: start development on port 4000; override with `FRONTEND_PORT=4100 npm run dev`.
- `npm run build`: run diagnostics, then produce the SSR build in `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run lint` / `npm run lint:fix`: check supported source files or apply automatic fixes.
- `npm test`: run Node's built-in venue-data tests (Node.js 22.6+).
- `npm run build:docker`: build the `fuelltreffer` Docker image; a local `.env` is optional.

## Coding Style & Naming Conventions

Use two-space indentation, ES modules, single-quoted JavaScript strings, and semicolons. Use PascalCase components and camelCase variables/functions. Keep API interfaces in `src/types/api.ts`; TypeScript uses Astro's strict configuration and the `@/*` alias.

Prefer `const`; ESLint prohibits `var` in JavaScript. Prefix intentionally unused bindings with `_`. ESLint currently ignores `.astro` and `.svelte` files; no formatter is configured. Preserve Tailwind responsive and `dark:` variants when changing UI.

## Testing Guidelines

Use `tests/*.test.mjs` and Node's built-in test runner for venue-data behavior; no coverage threshold is configured. Run tests, lint, and build, then exercise affected dashboard or match-report flows. Check mobile layouts, both themes, and API error states. Mock OSM tiles in automated browser tests. Follow `docs/spielorte.md` for snapshot and coordinate maintenance; never geocode during builds or page requests.

## Commit & Pull Request Guidelines

Prefer the history's `feat:`, `fix:`, and `chore:` prefixes for focused commits. PRs should describe behavior/configuration changes, link issues, list validation, and include screenshots for UI changes.

## Security & Configuration

Use `.env.example` for configuration. Production routing uses `APP_DOMAIN` (default: `darts.sc-oberfuellbach.de`); upstream data uses `TWOK_SOFTWARE_API_URL`. Umami is optional and its `PUBLIC_*` settings are build-time values. Video, chat, and streamer authentication have been removed. Never commit credentials or expose secrets through `PUBLIC_*` variables.
