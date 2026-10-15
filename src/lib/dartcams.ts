import { CURRENT_LEAGUE } from '../config/league.ts';
import type { DartcamsContext, DartcamsFixture, DartcamsTeam } from '../types/api.ts';

const MINUTE = 60_000;
const FINISHED = new Set(['FINISH', 'FINISHED', 'ENDED', 'COMPLETE']);
const LIVE = new Set(['ACTIVE', 'LIVE', 'RUNNING', 'IN_PROGRESS']);
const CANCELLED = new Set(['CANCELLED', 'CANCELED', 'POSTPONED']);
const record = (value: unknown): value is Record<string, unknown> => !!value && typeof value === 'object' && !Array.isArray(value);
const id = (value: unknown) => (typeof value === 'number' || typeof value === 'string') && Number.isSafeInteger(Number(value)) && Number(value) > 0 ? Number(value) : null;
const text = (value: unknown) => typeof value === 'string' ? value.trim() : '';
const berlinDate = (time: number) => new Intl.DateTimeFormat('sv-SE', { timeZone: 'Europe/Berlin', year: 'numeric', month: '2-digit', day: '2-digit' }).format(time);

export function readFixtures(payload: unknown, eventId = Number(CURRENT_LEAGUE.eventId), participantId = Number(CURRENT_LEAGUE.defaultParticipantId), databaseId = Number(CURRENT_LEAGUE.api.databaseId)): DartcamsFixture[] {
  if (!record(payload) || !record(payload.participant) || id(payload.participant.id) !== participantId || !Array.isArray(payload.matches)) throw new Error('Ungültiger Spielplan');
  return payload.matches.flatMap((match): DartcamsFixture[] => {
    if (!record(match) || !record(match.participantHome) || !record(match.participantGuest)) return [];
    const matchId = id(match.id);
    const homeId = id(match.participantHome.id);
    const guestId = id(match.participantGuest.id);
    const datePlanned = text(match.datePlanned);
    const status = text(match.statusCd).toUpperCase();
    if (!matchId || !homeId || !guestId || id(match.eventId) !== eventId || ![homeId, guestId].includes(participantId) ||
      match.active === false || match.byeHome || match.byeAway || CANCELLED.has(status) || !Number.isFinite(Date.parse(datePlanned))) return [];
    return [{
      matchId, eventId, databaseId, datePlanned: new Date(datePlanned).toISOString(),
      roundName: record(match.round) ? text(match.round.name) || 'Spieltag' : 'Spieltag',
      status: FINISHED.has(status) ? 'finished' : LIVE.has(status) ? 'live' : 'upcoming',
      liveUrl: `https://live.3k-darts.com/event/${databaseId}/${matchId}`,
      home: { participantId: homeId, name: text(match.participantHome.displayName) || 'Heim', logoUrl: null },
      guest: { participantId: guestId, name: text(match.participantGuest.displayName) || 'Gast', logoUrl: null },
    }];
  });
}

/** Keep an explicitly selected fixture for the current session, including its final score. */
export function selectFixture(fixtures: DartcamsFixture[], now: number, matchId?: number): DartcamsFixture | null {
  if (matchId !== undefined) return fixtures.find(fixture => fixture.matchId === matchId) ?? null;
  const open = fixtures.filter(fixture => fixture.status !== 'finished');
  const recent = open.filter(fixture => {
    const start = Date.parse(fixture.datePlanned);
    return start <= now && (now - start <= 12 * 60 * MINUTE || berlinDate(start) === berlinDate(now));
  }).sort((a, b) => Date.parse(b.datePlanned) - Date.parse(a.datePlanned));
  return recent.find(fixture => fixture.status === 'live') ?? recent[0] ??
    open.filter(fixture => Date.parse(fixture.datePlanned) > now)
      .sort((a, b) => Date.parse(a.datePlanned) - Date.parse(b.datePlanned))[0] ?? null;
}

export function readLogos(payload: unknown, storyBase: string): Map<number, string> {
  if (!record(payload) || !Array.isArray(payload.teams)) throw new Error('Ungültige Teamdaten');
  const origin = new URL(storyBase).origin;
  const logos = new Map<number, string>();
  for (const team of payload.teams) {
    if (!record(team)) continue;
    const participantId = id(team.threeKParticipantId);
    if (!participantId || !text(team.logo)) continue;
    try {
      const url = new URL(text(team.logo), `${origin}/`);
      if (url.origin === origin && url.protocol === 'https:' && !url.username && !url.password) logos.set(participantId, url.href);
    } catch { /* A broken logo must not prevent a fixture from loading. */ }
  }
  return logos;
}

export function createDartcamsContextService(options: {
  fetchImpl?: typeof fetch;
  now?: () => number;
  apiBase?: string;
  storyBase?: string;
} = {}) {
  const fetcher = options.fetchImpl ?? fetch;
  const now = options.now ?? Date.now;
  const apiBase = (options.apiBase ?? process.env.TWOK_SOFTWARE_API_URL ?? CURRENT_LEAGUE.api.twokSoftwareBaseUrl).replace(/\/$/, '');
  const storyBase = (options.storyBase ?? process.env.DARTSTORY_URL ?? 'https://dartstory.ingomc.de').replace(/\/$/, '');
  let fixtures: DartcamsFixture[] | null = null;
  let fetchedAt = '';
  let stale = false;
  let logos = new Map<number, string>();
  let logosStale = false;
  let attemptedAt = -Infinity;
  let logosAttemptedAt = -Infinity;
  let pending: Promise<void> | null = null;

  async function json(url: string, timeout: number): Promise<unknown> {
    const response = await fetcher(url, { signal: AbortSignal.timeout(timeout), headers: { accept: 'application/json', 'User-Agent': 'Fuelltreffer-Dartcams/1.0' } });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function refreshFixtures() {
    try {
      fixtures = readFixtures(await json(`${apiBase}/participant/${CURRENT_LEAGUE.defaultParticipantId}`, 8000));
      fetchedAt = new Date(now()).toISOString();
      stale = false;
    } catch {
      stale = true;
    }
  }

  async function refreshLogos() {
    if (now() - logosAttemptedAt < (logosStale ? MINUTE : 5 * MINUTE)) return;
    logosAttemptedAt = now();
    try {
      logos = readLogos(await json(`${storyBase}/api/state`, 2500), storyBase);
      logosStale = false;
    } catch {
      logosStale = true;
    }
  }

  return {
    async load(matchId?: number): Promise<DartcamsContext> {
      if (!pending && now() - attemptedAt >= MINUTE) {
        attemptedAt = now();
        pending = Promise.all([refreshFixtures(), refreshLogos()]).then(() => {}).finally(() => { pending = null; });
      }
      if (pending) await pending;
      if (!fixtures) throw new Error('Spielplan derzeit nicht erreichbar');
      const fixture = selectFixture(fixtures, now(), matchId);
      const withLogo = (team: DartcamsTeam): DartcamsTeam => ({ ...team, logoUrl: logos.get(team.participantId) ?? null });
      return {
        version: 1, fetchedAt, stale, logosStale,
        fixture: fixture ? { ...fixture, home: withLogo(fixture.home), guest: withLogo(fixture.guest) } : null,
      };
    },
  };
}

export const dartcamsContextService = createDartcamsContextService();

/** Public fixture/logo metadata only; no credentials or write methods are exposed. */
export function contextResponse(body: DartcamsContext | { error: string }, status = 200): Response {
  return new Response(JSON.stringify(body), { status, headers: {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, OPTIONS',
    'Cache-Control': status === 200 && 'stale' in body && !body.stale ? 'public, max-age=30' : 'no-store',
  } });
}
