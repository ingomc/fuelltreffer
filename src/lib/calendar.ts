import { CURRENT_LEAGUE } from '../config/league.ts';

export const REFRESH_MS = 6 * 60 * 60 * 1000;
export type CalendarVenue = { name?: string; locationStreet?: string; locationPostalCode?: string; locationCity?: string; infoU18?: boolean; infoSmokers?: boolean; infoAccessible?: boolean; numberOfBoards?: number };
type Side = { id: number | string; displayName?: string };
export type CalendarMatch = { id: number | string; eventId: number; participantHome?: Side; participantGuest?: Side; datePlanned?: string; byeHome?: boolean; byeAway?: boolean; statusCd?: string; round?: { name?: string } };
export type CalendarData = { participant: { id: number | string; teamSeason?: { playingVenue?: CalendarVenue } }; matches: CalendarMatch[] };
const escape = (value: string) => value.replace(/\\/g, '\\\\').replace(/\r?\n|\r/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
const stamp = (date: Date) => date.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const yesNo = (value?: boolean) => value === true ? 'Ja' : value === false ? 'Nein' : 'Keine Angabe';

export function foldLine(line: string): string {
  let output = '';
  let bytes = 0;
  for (const char of line) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) { output += '\r\n '; bytes = 1; }
    output += char;
    bytes += size;
  }
  return output;
}

export function renderCalendar(teamId: string, data: CalendarData, venues: Map<string, CalendarVenue>, updated: Date, origin: string): string {
  const name = (side: Side) => CURRENT_LEAGUE.teams.find(team => team.id === String(side.id))?.shortName || side.displayName || 'Mannschaft';
  const team = CURRENT_LEAGUE.teams.find(team => team.id === teamId)!;
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Fuelltreffer//Spielplan//DE', 'CALSCALE:GREGORIAN', `X-WR-CALNAME:${escape(`${team.shortName} · Saison ${CURRENT_LEAGUE.season}`)}`];
  const seen = new Set<string>();
  for (const match of data.matches) {
    const home = match.participantHome;
    const guest = match.participantGuest;
    const start = new Date(match.datePlanned || '');
    if (match.eventId !== CURRENT_LEAGUE.eventId || !home || !guest || match.byeHome || match.byeAway || !Number.isFinite(start.getTime()) || !match.id || seen.has(String(match.id)) || ![String(home.id), String(guest.id)].includes(teamId)) continue;
    seen.add(String(match.id));
    const venue = venues.get(String(home.id));
    const url = `${origin}/match/${match.eventId}/${match.id}/report?team=${teamId}`;
    const description = [String(home.id) === teamId ? 'Heimspiel' : 'Auswärtsspiel', match.round?.name, 'Dauer: 4 Stunden (geschätzt)', `U18: ${yesNo(venue?.infoU18)} · Rauchen: ${yesNo(venue?.infoSmokers)} · Barrierefrei: ${yesNo(venue?.infoAccessible)} · Boards: ${venue?.numberOfBoards ?? 'Keine Angabe'}`, url].filter(Boolean).join('\n');
    lines.push('BEGIN:VEVENT', `UID:${match.eventId}-${match.id}@darts.sc-oberfuellbach.de`, `DTSTAMP:${stamp(updated)}`, `DTSTART:${stamp(start)}`, `DTEND:${stamp(new Date(start.getTime() + 4 * 60 * 60 * 1000))}`, `SUMMARY:${escape(`${name(home)} vs. ${name(guest)}`)}`, `DESCRIPTION:${escape(description)}`, `URL:${url}`);
    const location = [venue?.name, venue?.locationStreet, [venue?.locationPostalCode, venue?.locationCity].filter(Boolean).join(' ')].filter(Boolean).join(', ');
    if (location) lines.push(`LOCATION:${escape(location)}`);
    if (match.statusCd === 'CANCELLED') lines.push('STATUS:CANCELLED');
    lines.push('END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}

export function createCalendarCache(fetcher: typeof fetch = fetch, origin = 'https://darts.sc-oberfuellbach.de') {
  const data = new Map<string, CalendarData>();
  const feeds = new Map<string, string>();
  let pending: Promise<void> | undefined;
  let timer: ReturnType<typeof setInterval> | undefined;
  function refresh(): Promise<void> {
    if (pending) return pending;
    pending = (async () => {
      for (let index = 0; index < CURRENT_LEAGUE.teams.length; index += 2) {
        await Promise.all(CURRENT_LEAGUE.teams.slice(index, index + 2).map(async team => {
          try {
            const base = process.env.TWOK_SOFTWARE_API_URL || CURRENT_LEAGUE.api.twokSoftwareBaseUrl;
            const response = await fetcher(`${base.replace(/\/$/, '')}/participant/${team.id}`, { signal: AbortSignal.timeout(8000), headers: { 'User-Agent': 'Fuelltreffer-Kalender/1.0' } });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            const payload = await response.json();
            if (String(payload?.participant?.id) !== team.id || !Array.isArray(payload.matches) || payload.matches.some((match: unknown) => !match || typeof match !== 'object')) throw new Error('Ungültige Teilnehmerdaten');
            data.set(team.id, payload);
          } catch (error) { console.warn(`[calendar] ${team.id}: letzter erfolgreicher Stand bleibt erhalten`, error instanceof Error ? error.message : 'API-Fehler'); }
        }));
      }
      const venues = new Map<string, CalendarVenue>();
      for (const [id, payload] of data) if (payload.participant.teamSeason?.playingVenue) venues.set(id, payload.participant.teamSeason.playingVenue);
      for (const [id, payload] of data) {
        const next = renderCalendar(id, payload, venues, new Date(), origin);
        // Preserve DTSTAMP on unchanged feeds.
        if (next.replace(/DTSTAMP:[^\r]+/g, '') !== feeds.get(id)?.replace(/DTSTAMP:[^\r]+/g, '')) feeds.set(id, next);
      }
    })().finally(() => { pending = undefined; });
    return pending;
  }
  return {
    refresh,
    get: (id: string) => feeds.get(id),
    start() { if (!timer) { void refresh(); timer = setInterval(() => { void refresh(); }, REFRESH_MS); timer.unref?.(); } },
    stop() { if (timer) clearInterval(timer); timer = undefined; }
  };
}

export const calendarCache = createCalendarCache();
