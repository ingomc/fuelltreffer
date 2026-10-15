import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFixtures, selectFixture, readLogos, createDartcamsContextService, contextResponse } from '../src/lib/dartcams.ts';

const teamId = 633505;
const storyBase = 'https://dartstory.ingomc.de';
const at = value => Date.parse(value);
const match = (id, datePlanned, statusCd = 'OPEN', overrides = {}) => ({
  id, eventId: 24970, datePlanned, statusCd, active: true,
  participantHome: { id: teamId, displayName: 'SCO' },
  participantGuest: { id: 632080, displayName: 'Gast' },
  round: { name: 'Spieltag 4' }, ...overrides,
});
const schedule = matches => ({ participant: { id: teamId }, matches });
const fixture = (id, time, status) => readFixtures(schedule([match(id, time, status)]))[0];
const teams = { teams: [
  { id: 'sco', name: 'Anderer Anzeigename', threeKParticipantId: teamId, logo: '/logo_sco.png' },
  { id: 'guest', threeKParticipantId: 632080, logo: '/uploads/guest.png' },
] };

test('selection chooses today or an active late-night match, then the nearest upcoming fixture', () => {
  const fixtures = [
    fixture(1, '2026-10-09T16:00:00Z', 'ACTIVE'), // Forgotten old live status is not current.
    fixture(2, '2026-10-16T16:00:00Z', 'OPEN'),
    fixture(3, '2026-10-23T16:00:00Z', 'OPEN'),
  ];
  assert.equal(selectFixture(fixtures, at('2026-10-15T12:00:00Z')).matchId, 2);
  assert.equal(selectFixture(fixtures, at('2026-10-16T18:00:00Z')).matchId, 2);
  fixtures[1].status = 'live';
  assert.equal(selectFixture(fixtures, at('2026-10-17T00:30:00Z')).matchId, 2);
  fixtures[1].status = 'finished';
  assert.equal(selectFixture(fixtures, at('2026-10-17T00:30:00Z')).matchId, 3);
  assert.equal(selectFixture(fixtures, at('2026-10-17T00:30:00Z'), 2).matchId, 2);
  assert.equal(selectFixture(fixtures, at('2026-10-17T00:30:00Z'), 999), null);
  assert.equal(selectFixture([], Date.now()), null);
});

test('schedule excludes cancellations, byes, other teams/seasons and malformed records', () => {
  const normal = match(1, '2026-10-16T16:00:00.000+0000');
  const valid = readFixtures(schedule([
    normal, { ...normal, id: 2, statusCd: 'CANCELLED' },
    { ...normal, id: 3, byeAway: true }, { ...normal, id: 4, active: false },
    { ...normal, id: 5, eventId: 1 }, { ...normal, id: 6, datePlanned: 'invalid' },
    { ...normal, id: 7, participantHome: { id: 9 } }, null,
  ]));
  assert.equal(valid.length, 1);
  assert.equal(valid[0].datePlanned, '2026-10-16T16:00:00.000Z');
  assert.equal(valid[0].liveUrl, 'https://live.3k-darts.com/event/5/1');
  assert.equal(valid[0].status, 'upcoming'); // active:true alone never means live.
  assert.throws(() => readFixtures({ participant: { id: 9 }, matches: [] }));
  assert.throws(() => readFixtures({ participant: { id: teamId } }));
});

test('logos are joined by participant ID, accept relative uploads, and ignore unrelated URLs', () => {
  const logos = readLogos({ teams: [...teams.teams,
    { name: 'SCO', logo: '/wrong.png' },
    { threeKParticipantId: 4, logo: 'https://unrelated.example/logo.png' },
    { threeKParticipantId: 5, logo: 'javascript:alert(1)' },
    { threeKParticipantId: 6, logo: '//unrelated.example/logo.png' },
    { threeKParticipantId: 7, logo: 'https://user:password@dartstory.ingomc.de/logo.png' },
  ] }, storyBase);
  assert.deepEqual([...logos], [[teamId, `${storyBase}/logo_sco.png`], [632080, `${storyBase}/uploads/guest.png`]]);
});

test('service caches and deduplicates fetches and keeps the last good data on upstream failure', async () => {
  let now = at('2026-10-15T12:00:00Z');
  let failure = false;
  const calls = [];
  const service = createDartcamsContextService({ now: () => now, apiBase: 'https://league.example', storyBase,
    fetchImpl: async url => {
      calls.push(url);
      if (failure) throw new Error('offline');
      return Response.json(url.endsWith('/api/state') ? teams : schedule([match(1, '2026-10-16T16:00:00Z')]));
    },
  });
  const [first, parallel] = await Promise.all([service.load(), service.load()]);
  assert.deepEqual(first, parallel);
  assert.equal(calls.length, 2);
  assert.equal(first.fixture.home.logoUrl, `${storyBase}/logo_sco.png`);
  await service.load();
  assert.equal(calls.length, 2);
  now += 60_000;
  await service.load();
  assert.equal(calls.length, 3); // Logos have a five-minute cache.
  const lastFetchedAt = new Date(now).toISOString();
  now += 5 * 60_000;
  failure = true;
  const cached = await service.load(1);
  assert.equal(cached.stale, true);
  assert.equal(cached.logosStale, true);
  assert.equal(cached.fetchedAt, lastFetchedAt);
  assert.equal(cached.fixture.home.logoUrl, first.fixture.home.logoUrl);
  failure = false;
  now += 60_000;
  const recovered = await service.load(1);
  assert.equal(recovered.stale, false);
  assert.equal(recovered.logosStale, false);
});

test('unavailable logos do not prevent scoring, but a first schedule failure is an error', async () => {
  const service = createDartcamsContextService({ storyBase,
    fetchImpl: async url => {
      if (url.endsWith('/api/state')) throw new Error('Story offline');
      return Response.json(schedule([match(1, '2026-10-16T16:00:00Z')]));
    },
    now: () => at('2026-10-15T12:00:00Z'),
  });
  const result = await service.load();
  assert.equal(result.stale, false);
  assert.equal(result.logosStale, true);
  assert.equal(result.fixture.home.logoUrl, null);
  assert.equal(result.fixture.liveUrl, 'https://live.3k-darts.com/event/5/1');
  const unavailable = createDartcamsContextService({ fetchImpl: async () => { throw new Error('offline'); } });
  await assert.rejects(unavailable.load(), /Spielplan/);
});

test('public context responses expose CORS for reads and never cache errors or stale data', () => {
  const context = { version: 1, fetchedAt: new Date().toISOString(), stale: false, logosStale: false, fixture: null };
  const fresh = contextResponse(context);
  assert.equal(fresh.headers.get('Access-Control-Allow-Origin'), '*');
  assert.equal(fresh.headers.get('Access-Control-Allow-Methods'), 'GET, OPTIONS');
  assert.equal(fresh.headers.get('Access-Control-Allow-Credentials'), null);
  assert.equal(fresh.headers.get('Cache-Control'), 'public, max-age=30');
  assert.equal(contextResponse({ ...context, stale: true }).headers.get('Cache-Control'), 'no-store');
  const error = contextResponse({ error: 'Unavailable' }, 502);
  assert.equal(error.status, 502);
  assert.equal(error.headers.get('Cache-Control'), 'no-store');
});
