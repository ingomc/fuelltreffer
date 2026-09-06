import type { APIRoute } from 'astro';
import { CURRENT_LEAGUE } from '../../../../../config/league.ts';
import { getLiveScope, LIVE_API_URL, selectLiveMatches } from '../../../../../lib/live-scores.ts';

const headers = { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };

export const GET: APIRoute = async ({ params }) => {
  const { eventId, matchId } = params;
  if (!eventId || !matchId || !/^[1-9]\d*$/.test(eventId) || !/^[1-9]\d*$/.test(matchId)) {
    return new Response(JSON.stringify({ error: 'Ungültige Spiel-ID' }), { status: 400, headers });
  }
  try {
    const apiUrl = process.env.TWOK_SOFTWARE_API_URL || CURRENT_LEAGUE.api.twokSoftwareBaseUrl;
    const report = await fetch(`${apiUrl}/event/${eventId}/match/${matchId}/report`, {
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    if (!report.ok) throw new Error(`Match report: ${report.status}`);
    const scope = getLiveScope(await report.json(), eventId, matchId);
    if (!scope || scope.finished) {
      return new Response(JSON.stringify({ scope, matches: [] }), { headers });
    }
    const response = await fetch(`${LIVE_API_URL}/match/${scope.database}/0/${scope.groupKey}`, {
      headers: { Accept: 'application/json' }, signal: AbortSignal.timeout(8000), cache: 'no-store',
    });
    if (!response.ok) throw new Error(`Live scores: ${response.status}`);
    const matches = selectLiveMatches(await response.json(), scope);
    return new Response(JSON.stringify({ scope, matches }), { headers });
  } catch (error) {
    console.error('[proxy:live-scores]', error instanceof Error ? error.message : 'Request failed');
    return new Response(JSON.stringify({ error: 'Live-Scores sind gerade nicht erreichbar.' }), { status: 502, headers });
  }
};
