import type { APIRoute } from 'astro';
import { contextResponse, dartcamsContextService } from '../../../lib/dartcams';

export const GET: APIRoute = async ({ url }) => {
  const selected = url.searchParams.get('match');
  if (selected !== null && (!/^\d+$/.test(selected) || !Number.isSafeInteger(Number(selected)) || Number(selected) <= 0)) {
    return contextResponse({ error: 'Ungültige Spiel-ID' }, 400);
  }
  try {
    return contextResponse(await dartcamsContextService.load(selected === null ? undefined : Number(selected)));
  } catch {
    return contextResponse({ error: 'Spielplan derzeit nicht erreichbar' }, 502);
  }
};

export const OPTIONS: APIRoute = () => new Response(null, { status: 204, headers: {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Max-Age': '86400',
} });
