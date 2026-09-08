import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createCalendarCache, renderCalendar, REFRESH_MS } from '../src/lib/calendar.ts';
import { CURRENT_LEAGUE } from '../src/config/league.ts';

const match = { id: 123, eventId: 24970, participantHome: { id: 632076 }, participantGuest: { id: 633505 }, datePlanned: '2026-09-09T16:00:00.000+0000', round: { name: 'Spieltag 1' } };
const payload = (id, matches = [match]) => ({ participant: { id, teamSeason: { playingVenue: { name: 'Sportheim', locationStreet: 'Straße 1', locationPostalCode: '12345', locationCity: 'Ort', infoU18: true, infoSmokers: false, numberOfBoards: 4 } } }, matches });
const render = (matches, venues = new Map()) => renderCalendar('633505', payload(633505, matches), venues, new Date('2026-09-08T00:00:00Z'), 'https://example.org');

test('calendar uses home venue, escaped details, four hours and stable UID across rescheduling', () => {
  const venues = new Map([['632076', { ...payload(632076).participant.teamSeason.playingVenue, name: 'Cafe; Q, ä'.repeat(20) }]]);
  const feed = render([match], venues);
  assert.match(feed, /SUMMARY:Cafe Q vs. Fülltreffer/);
  assert.match(feed, /DTSTART:20260909T160000Z/);
  assert.match(feed, /DTEND:20260909T200000Z/);
  assert.match(feed, /LOCATION:Cafe\\; Q\\, ä/);
  const unfolded = feed.replace(/\r\n /g, '');
  assert.match(unfolded, /U18: Ja · Rauchen: Nein · Barrierefrei: Keine Angabe · Boards: 4/);
  for (const line of feed.split('\r\n')) assert.ok(Buffer.byteLength(line) <= 75);
  const moved = render([{ ...match, datePlanned: '2026-12-01T18:00:00+0100', statusCd: 'CANCELLED' }]);
  assert.equal(feed.match(/UID:.*/)[0], moved.match(/UID:.*/)[0]);
  assert.match(moved, /DTSTART:20261201T170000Z/);
  assert.match(moved, /STATUS:CANCELLED/);
});

test('filters invalid, foreign and bye matches and keeps past matches without venue', () => {
  const feed = render([match, match, { ...match, id: 2, eventId: 1 }, { ...match, id: 3, byeHome: true }, { ...match, id: 4, datePlanned: '' }]);
  assert.equal(feed.split('BEGIN:VEVENT').length - 1, 1);
  assert.ok(!feed.includes('LOCATION:'));
});

test('worker refreshes without requests every six hours and stops cleanly', async t => {
  t.mock.timers.enable({ apis: ['setInterval'] });
  let calls = 0;
  const cache = createCalendarCache(async url => {
    calls++;
    return Response.json(payload(url.split('/').at(-1)));
  });
  cache.start();
  cache.start();
  await cache.refresh();
  assert.equal(calls, 10);
  t.mock.timers.tick(REFRESH_MS - 1);
  assert.equal(calls, 10);
  t.mock.timers.tick(1);
  await cache.refresh();
  assert.equal(calls, 20);
  cache.stop();
  t.mock.timers.tick(REFRESH_MS);
  assert.equal(calls, 20);
});

test('updated home address appears in both calendars on the next refresh', async () => {
  let street = 'Alte Straße 1';
  const cache = createCalendarCache(async url => {
    const result = payload(url.split('/').at(-1));
    result.participant.teamSeason.playingVenue.locationStreet = street;
    return Response.json(result);
  });
  await cache.refresh();
  assert.match(cache.get('633505'), /Alte Straße 1/);
  street = 'Neue Straße 2';
  await cache.refresh();
  assert.match(cache.get('633505'), /Neue Straße 2/);
  assert.match(cache.get('632076'), /Neue Straße 2/);
});

test('refresh is shared, bounded, cached and retains good data after upstream failure', async () => {
  let calls = 0;
  let active = 0;
  let maximum = 0;
  let fail = false;
  const cache = createCalendarCache(async url => {
    calls++; active++; maximum = Math.max(maximum, active);
    await new Promise(resolve => setTimeout(resolve, 1));
    active--;
    if (fail) return new Response('', { status: 503 });
    const id = url.split('/').at(-1);
    return Response.json(payload(id));
  });
  const first = cache.refresh();
  assert.equal(first, cache.refresh());
  await first;
  assert.equal(calls, CURRENT_LEAGUE.teams.length);
  assert.equal(maximum, 2);
  const before = cache.get('633505');
  assert.ok(before);
  cache.get('633505');
  assert.equal(calls, 10);
  fail = true;
  await cache.refresh();
  assert.equal(cache.get('633505'), before);
  assert.equal(REFRESH_MS, 21600000);
});
