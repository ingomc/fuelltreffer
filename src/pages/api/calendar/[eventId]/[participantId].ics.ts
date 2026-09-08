import type { APIRoute } from 'astro';
import { CURRENT_LEAGUE } from '../../../../config/league';
import { calendarCache } from '../../../../lib/calendar';

export const GET: APIRoute = ({ params }) => {
  if (params.eventId !== String(CURRENT_LEAGUE.eventId) || !CURRENT_LEAGUE.teams.some(team => team.id === params.participantId)) {
    return new Response('Kalender nicht verfügbar', { status: 404, headers: { 'Cache-Control': 'no-store' } });
  }
  const feed = calendarCache.get(params.participantId!);
  if (!feed) return new Response('Kalender wird aktualisiert. Bitte später erneut versuchen.', { status: 503, headers: { 'Cache-Control': 'no-store', 'Retry-After': '60' } });
  return new Response(feed, { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'no-cache' } });
};
