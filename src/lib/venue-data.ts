export type Venue = {
  id: string;
  name: string;
  street: string;
  postalCode: string;
  city: string;
};

export type VenueTeam = { teamId: string; teamName: string; venue: Venue | null };
export type VenueSnapshot = { updatedAt: string; teams: VenueTeam[] };
export type VenueLocation = {
  venueId: string;
  addressKey: string;
  lat: number;
  lon: number;
  source: string;
};
export type VenueEntry = VenueTeam & {
  location: VenueLocation | null;
  osmUrl: string | null;
  fromSnapshot: boolean;
};

export function normalizeAddress(venue: Pick<Venue, 'street' | 'postalCode' | 'city'>): string {
  return [venue.street, venue.postalCode, venue.city]
    .map(part => part.normalize('NFKC').trim().toLocaleLowerCase('de-DE').replace(/\s+/g, ' '))
    .join('|');
}

const text = (value: unknown): string => typeof value === 'string' ? value.trim() : '';

/** Copy only the public venue fields, never contacts or player records. */
export function parseParticipant(data: unknown, team: { id: string; name: string }): VenueTeam {
  const participant = (data as { participant?: Record<string, unknown> })?.participant;
  if (!participant || String(participant.id) !== team.id) throw new Error('Unerwartete Teilnehmerdaten');
  const season = participant.teamSeason as Record<string, unknown> | undefined;
  if (!season || typeof season !== 'object' || Array.isArray(season)) throw new Error('Saisondaten fehlen');
  const source = season.playingVenue as Record<string, unknown> | null | undefined;
  if (source !== null && source !== undefined &&
    (typeof source !== 'object' || Array.isArray(source) || !String(source.id ?? '').trim())) {
    throw new Error('Ungültige Spielortdaten');
  }
  return {
    teamId: team.id,
    teamName: team.name,
    venue: source ? {
      id: typeof source.id === 'number' || typeof source.id === 'string' ? String(source.id) : '',
      name: text(source.name),
      street: text(source.locationStreet),
      postalCode: text(source.locationPostalCode),
      city: text(source.locationCity),
    } : null,
  };
}

export function addLocation(team: VenueTeam, locations: readonly VenueLocation[], fromSnapshot = false): VenueEntry {
  const venue = team.venue;
  const location = venue && locations.find(item =>
    item.venueId === venue.id && item.addressKey === normalizeAddress(venue) &&
    Number.isFinite(item.lat) && Math.abs(item.lat) <= 90 &&
    Number.isFinite(item.lon) && Math.abs(item.lon) <= 180
  ) || null;
  const address = venue && [venue.street, [venue.postalCode, venue.city].filter(Boolean).join(' ')].filter(Boolean).join(', ');
  const osmUrl = location
    ? `https://www.openstreetmap.org/?mlat=${location.lat}&mlon=${location.lon}#map=17/${location.lat}/${location.lon}`
    : address ? `https://www.openstreetmap.org/search?query=${encodeURIComponent(address)}` : null;
  return { ...team, location, osmUrl, fromSnapshot };
}

/** Used only while prerendering; browser code receives the resulting data. */
export async function loadVenues(
  teams: readonly { id: string; name: string }[],
  options: {
    baseUrl: string;
    snapshot: VenueSnapshot;
    locations: readonly VenueLocation[];
    fetcher?: typeof fetch;
    warn?: (message: string) => void;
    timeoutMs?: number;
  },
): Promise<VenueEntry[]> {
  const { snapshot, locations, fetcher = fetch, warn = console.warn, timeoutMs = 8000 } = options;
  const result: VenueEntry[] = [];
  // Bounded concurrency avoids a slow API adding ten serial timeouts to builds.
  for (let index = 0; index < teams.length; index += 2) {
    result.push(...await Promise.all(teams.slice(index, index + 2).map(async team => {
      let value: VenueTeam;
      let fromSnapshot = false;
      try {
        const response = await fetcher(`${options.baseUrl.replace(/\/$/, '')}/participant/${encodeURIComponent(team.id)}`, {
          signal: AbortSignal.timeout(timeoutMs),
          headers: { 'User-Agent': 'Fuelltreffer-Spielorte/1.0 (+https://darts.sc-oberfuellbach.de)' },
        });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        value = parseParticipant(await response.json(), team);
      } catch (_error) {
        const saved = snapshot.teams.find(item => item.teamId === team.id);
        value = saved ? { ...saved, teamName: team.name } : { teamId: team.id, teamName: team.name, venue: null };
        fromSnapshot = true;
        warn(`[spielorte] ${team.name}: API nicht verfügbar; ${saved ? `Datenstand ${snapshot.updatedAt}` : 'kein gespeicherter Spielort'}.`);
      }
      const entry = addLocation(value, locations, fromSnapshot);
      if (entry.venue && !entry.location) warn(`[spielorte] ${team.name}: keine geprüften Koordinaten für die aktuelle Adresse.`);
      return entry;
    })));
  }
  return result.sort((a, b) => a.teamName.localeCompare(b.teamName, 'de'));
}

export function groupVenues(entries: readonly VenueEntry[]) {
  const groups = new Map<string, { key: string; venue: Venue; location: VenueLocation; osmUrl: string; teams: { id: string; name: string }[] }>();
  for (const entry of entries) {
    if (!entry.venue || !entry.location || !entry.osmUrl) continue;
    const key = `${entry.venue.id}:${normalizeAddress(entry.venue)}`;
    let group = groups.get(key);
    if (!group) {
      group = { key, venue: entry.venue, location: entry.location, osmUrl: entry.osmUrl, teams: [] };
      groups.set(key, group);
    }
    group.teams.push({ id: entry.teamId, name: entry.teamName });
  }
  return [...groups.values()];
}
