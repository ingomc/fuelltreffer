import assert from 'node:assert/strict';
import test from 'node:test';
import snapshot from '../src/data/venues.snapshot.json' with { type: 'json' };
import locations from '../src/data/venue-locations.json' with { type: 'json' };
import { CURRENT_LEAGUE } from '../src/config/league.ts';
import { addLocation, groupVenues, loadVenues, normalizeAddress, parseParticipant } from '../src/lib/venue-data.ts';

const team = CURRENT_LEAGUE.teams[0];
const saved = snapshot.teams.find(item => item.teamId === team.id);
const apiData = (venue = saved.venue) => ({ participant: {
  id: Number(team.id),
  email: 'must-not-be-published@example.test',
  teamSeason: { name: team.name, teamMembers: [{ name: 'Private player' }], playingVenue: {
    id: Number(venue.id), name: venue.name, locationStreet: venue.street,
    locationPostalCode: venue.postalCode, locationCity: venue.city,
    phone: 'private phone', contactPerson: 'Private contact',
  } },
} });
const options = { baseUrl: 'https://api.example.test', snapshot, locations, warn: () => {} };

test('current Liga B2 and stored data cover all ten teams with reviewed coordinates', () => {
  assert.equal(CURRENT_LEAGUE.eventId, 24970);
  assert.equal(CURRENT_LEAGUE.defaultParticipantId, '633505');
  assert.equal(CURRENT_LEAGUE.teams.length, 10);
  assert.deepEqual(new Set(snapshot.teams.map(item => item.teamId)), new Set(CURRENT_LEAGUE.teams.map(item => item.id)));
  for (const entry of snapshot.teams) {
    const mapped = addLocation(entry, locations);
    assert.ok(mapped.location, `Missing location: ${entry.teamName}`);
    assert.match(mapped.location.source, /^https:\/\/www.openstreetmap.org\/(node|way|relation)\/\d+$/);
    assert.ok(mapped.location.lat > 49 && mapped.location.lat < 51);
    assert.ok(mapped.location.lon > 10 && mapped.location.lon < 12);
  }
});

test('participant parsing publishes only the required team and venue fields', () => {
  assert.deepEqual(parseParticipant(apiData(), team), saved);
  assert.throws(() => parseParticipant({ participant: { id: 123 } }, team));
  assert.throws(() => parseParticipant({ participant: { id: team.id } }, team));
  assert.equal(parseParticipant({ participant: { id: team.id, teamSeason: { playingVenue: null } } }, team).venue, null);
});

test('a live address change never reuses coordinates for the previous address', async () => {
  const changed = { ...saved.venue, street: 'Neue Straße 123' };
  const [entry] = await loadVenues([team], { ...options, fetcher: async () => Response.json(apiData(changed)) });
  assert.equal(entry.fromSnapshot, false);
  assert.equal(entry.venue.street, changed.street);
  assert.equal(entry.location, null);
  assert.ok(entry.osmUrl.startsWith('https://www.openstreetmap.org/search?query='));
  assert.ok(decodeURIComponent(entry.osmUrl).includes(changed.street));
});

test('HTTP errors, network errors and invalid API data fall back per team', async () => {
  for (const fetcher of [
    async () => new Response('', { status: 503 }),
    async () => { throw new Error('offline'); },
    async () => Response.json({ participant: { id: 'wrong-team' } }),
    async () => new Response('{invalid-json'),
  ]) {
    const warnings = [];
    const [entry] = await loadVenues([team], { ...options, fetcher, warn: message => warnings.push(message) });
    assert.equal(entry.fromSnapshot, true);
    assert.deepEqual(entry.venue, saved.venue);
    assert.ok(entry.location);
    assert.ok(warnings.some(message => message.includes(snapshot.updatedAt)));
  }
});

test('a new team without saved data stays visible when the API fails', async () => {
  const [entry] = await loadVenues([{ id: 'new', name: 'Neues Team' }], { ...options, fetcher: async () => new Response('', { status: 404 }) });
  assert.equal(entry.teamName, 'Neues Team');
  assert.equal(entry.venue, null);
  assert.equal(entry.location, null);
  assert.equal(entry.osmUrl, null);
});

test('shared venues have one marker and keep all associated teams', () => {
  const first = addLocation(saved, locations);
  const second = addLocation({ ...saved, teamId: 'second', teamName: 'Zweite Mannschaft' }, locations);
  const groups = groupVenues([first, second]);
  assert.equal(groups.length, 1);
  assert.equal(groups[0].teams.length, 2);
  assert.equal(normalizeAddress({ ...saved.venue, street: ` ${saved.venue.street.toUpperCase()} ` }), normalizeAddress(saved.venue));
  const invalid = [{ ...locations[0], venueId: saved.venue.id, addressKey: normalizeAddress(saved.venue), lat: 999 }];
  assert.equal(addLocation(saved, invalid).location, null);
});

test('live data and fallbacks coexist, requests are bounded and results are sorted', async () => {
  let inFlight = 0;
  let maximum = 0;
  const entries = await loadVenues(CURRENT_LEAGUE.teams, { ...options, fetcher: async url => {
    inFlight++;
    maximum = Math.max(maximum, inFlight);
    await new Promise(resolve => setTimeout(resolve, 1));
    inFlight--;
    return String(url).endsWith(`/${team.id}`) ? Response.json(apiData()) : new Response('', { status: 500 });
  } });
  assert.ok(maximum <= 2);
  assert.equal(entries.length, 10);
  assert.equal(entries.filter(entry => !entry.fromSnapshot).length, 1);
  assert.deepEqual(entries.map(entry => entry.teamName), entries.map(entry => entry.teamName).sort((a, b) => a.localeCompare(b, 'de')));
});
