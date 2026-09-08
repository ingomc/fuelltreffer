import { defineMiddleware } from 'astro:middleware';
import { calendarCache } from './lib/calendar';

// Production launcher opts in; prerendering during builds never starts a worker.
if (import.meta.env.DEV || process.env.CALENDAR_WORKER === '1') calendarCache.start();
export const onRequest = defineMiddleware((_context, next) => next());
