// Start the calendar worker when Astro loads its middleware, before any requests.
process.env.CALENDAR_WORKER = '1';
await import('../dist/server/_astro-internal_middleware.mjs');
await import('../dist/server/entry.mjs');
