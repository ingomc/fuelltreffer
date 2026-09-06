import assert from 'node:assert/strict';
import test from 'node:test';
import { setImmediate } from 'node:timers/promises';
import { applyLiveUpdate, canCheckout, dartValue, getLiveScope, playerAverage, selectLiveMatches, visibleBoards } from '../src/lib/live-scores.ts';
import { createLiveScores } from '../src/lib/live-scores-client.ts';
import { GET } from '../src/pages/api/match/[eventId]/[matchId]/live.ts';

// Synthetic players, with the schema observed on the public 3K REST/STOMP feeds.
const report = [101, 102, 103].map(id => ({
  id, dbId: 5, eventId: 24970, statusCd: 'OPEN', event: { dbId: 5, eventTypeCd: 'LEAGUE' },
}));
const scope = getLiveScope(report, '24970', '3876204');
const player = (id, index) => ({
  id, index, playerName: `Testspieler ${index + 1}`, points: 144, lastScore: 100,
  darts: 15, legs: 1, sets: 0, scoreTotal: 850, dartsTotal: 45,
});
const raw = (overrides = {}) => ({
  id: 9001, matchKey: '101', database: '5', groupKey: '3876204', originalEventId: 24970,
  board: '1', status: 1, currentplayerIndex: 0, startplayerIndex: 1,
  roundName: 'Spieltag 1', mode: 'Best of 5 Legs', lastUpdate: '2026-09-06T11:00:00',
  matchPlayers: [player(501, 0), player(502, 1)], ...overrides,
});
const snapshot = (matches = [raw()], scopeOverride = scope) => ({ scope: scopeOverride, matches: selectLiveMatches({ data: matches }, scopeOverride) });
const flush = async () => { await setImmediate(); };

test('league scope uses dbId and the exact parent match, never backend hostname or event ID as group', () => {
  assert.equal(scope.database, '5');
  assert.equal(scope.groupKey, '3876204');
  assert.deepEqual(scope.matchKeys, ['101', '102', '103']);
  assert.equal(scope.finished, false);
  assert.equal(getLiveScope([], '24970', '3876204'), null);
  assert.equal(getLiveScope([{ ...report[0], eventId: 42 }], '24970', '3876204'), null);
  assert.equal(getLiveScope([{ ...report[0], dbId: null, event: {} }], '24970', '3876204'), null);
  assert.equal(getLiveScope(report, '../24970', '3876204'), null);
  assert.equal(getLiveScope(report.map(game => ({ ...game, statusCd: 'FINISH' })), '24970', '3876204').finished, true);
});

test('other databases, fixtures, events and games never appear even if board numbers coincide', () => {
  const unrelated = [raw({ database: '4' }), raw({ groupKey: 'other' }), raw({ matchKey: '777' }),
    raw({ originalEventId: 42 }), raw({ teamParentMatchId: 999 })];
  const matches = selectLiveMatches({ data: [raw(), ...unrelated] }, scope);
  assert.equal(matches.length, 1);
  for (const match of unrelated) assert.strictEqual(applyLiveUpdate(matches, { match }, scope), matches);
  assert.strictEqual(applyLiveUpdate(matches, { matchPlayer: { id: 777, dart1: 'T20' } }, scope), matches);
  assert.throws(() => selectLiveMatches({ unexpected: [] }, scope));
  assert.deepEqual(selectLiveMatches({ data: [raw({ matchPlayers: [{}] }), raw({ status: 4 })] }, scope), []);
});

test('rest points, active player, zero visits and per-dart updates survive until a full visit arrives', () => {
  let matches = snapshot().matches;
  matches = applyLiveUpdate(matches, { matchPlayer: { id: 501, dart1: 'T20', dart2: '0' } }, scope);
  assert.deepEqual(matches[0].matchPlayers[0].liveDarts, ['T20', '0']);
  assert.equal(playerAverage(matches[0].matchPlayers[0]), (910 / 47 * 3).toFixed(1));
  const updated = raw({ currentplayerIndex: 1, matchPlayers: [
    { ...player(501, 0), lastScore: 0, darts: 18 }, player(502, 1),
  ] });
  matches = applyLiveUpdate(matches, { match: updated }, scope);
  assert.equal(matches[0].currentplayerIndex, 1);
  assert.equal(matches[0].matchPlayers[0].lastScore, 0);
  assert.deepEqual(matches[0].matchPlayers[0].liveDarts, []);
  assert.equal(dartValue('DBULL'), 50);
  assert.equal(dartValue('S20'), 20);
  assert.equal(dartValue('invalid'), 0);
  for (const points of [2, 40, 144, 170]) assert.equal(canCheckout(points), true);
  for (const points of [0, 1, 159, 162, 163, 165, 166, 168, 169, 171]) assert.equal(canCheckout(points), false);
});

test('new games replace the previous game on the same board; finished/deleted/stale games disappear', () => {
  let matches = snapshot([raw({ board: '4' }), raw({ id: 9002, matchKey: '102', board: '3' })]).matches;
  assert.deepEqual(visibleBoards(matches).map(match => match.board), ['3', '4']);
  const next = raw({ id: 9003, matchKey: '103', board: '4', lastUpdate: '2026-09-06T11:01:00' });
  matches = applyLiveUpdate(matches, { match: next }, scope);
  assert.equal(matches.length, 2);
  assert.strictEqual(applyLiveUpdate(matches, { match: raw({ board: '4' }) }, scope), matches);
  matches = applyLiveUpdate(matches, { match: { ...next, status: 2 } }, scope);
  assert.deepEqual(visibleBoards(matches).map(match => match.board), ['3']);
  matches = applyLiveUpdate(matches, { match: raw({ id: 9002, matchKey: '102', board: '3', status: 4 }) }, scope);
  assert.deepEqual(visibleBoards(matches), []);
});

test('live proxy filters snapshots, disables caching, skips completed games and handles errors', async t => {
  const calls = [];
  t.mock.method(globalThis, 'fetch', async url => {
    calls.push(String(url));
    return Response.json(String(url).endsWith('/report') ? report : { data: [raw(), raw({ matchKey: '999' })] });
  });
  const context = { params: { eventId: '24970', matchId: '3876204' } };
  const response = await GET(context);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('Cache-Control'), 'no-store');
  assert.equal((await response.json()).matches.length, 1);
  assert.equal(calls[1], 'https://live.3k-darts.com/dartsscorer-liveticker/api/v1/match/5/0/3876204');
  assert.equal((await GET({ params: { eventId: '..', matchId: '123' } })).status, 400);
  assert.equal(calls.length, 2);
  t.mock.method(globalThis, 'fetch', async () => Response.json(report.map(game => ({ ...game, statusCd: 'FINISH' }))));
  assert.equal((await (await GET(context)).json()).scope.finished, true);
  t.mock.method(console, 'error', () => {});
  t.mock.method(globalThis, 'fetch', async () => new Response('', { status: 503 }));
  assert.equal((await GET(context)).status, 502);
});

function harness(t, fetcher) {
  const states = [];
  const clients = [];
  let changes = 0;
  const scores = createLiveScores({
    eventId: '24970', matchId: '3876204', fetcher,
    onChange: state => states.push(state), onResultChange: () => changes++,
    clientFactory: config => {
      const client = { config, connected: false, stopped: false, callback: null, destination: '',
        activate() {}, async deactivate() { this.stopped = true; this.connected = false; },
        subscribe(destination, callback) { this.destination = destination; this.callback = callback; },
        connect() { this.connected = true; config.onConnect(); },
        message(payload) { this.callback({ body: JSON.stringify(payload) }); },
      };
      clients.push(client);
      return client;
    },
  });
  t.after(() => scores.stop());
  return { scores, states, clients, latest: () => states.at(-1), changes: () => changes };
}

test('client connects only to this match, refreshes after reconnect and stops when finished', async t => {
  let data = snapshot();
  const h = harness(t, async () => Response.json(data));
  h.scores.start(); await flush();
  const client = h.clients[0];
  client.connect(); await flush();
  assert.equal(client.destination, '/topic/5-3876204');
  assert.equal(h.latest().connection, 'live');
  client.message({ match: raw({ matchPlayers: [{ ...player(501, 0), legs: 2 }, player(502, 1)] }) });
  assert.equal(h.latest().matches[0].matchPlayers[0].legs, 2);
  assert.equal(h.changes(), 1);
  client.connected = false; client.config.onWebSocketClose();
  assert.equal(h.latest().connection, 'reconnecting');
  data = snapshot([raw({ currentplayerIndex: 1 })]);
  client.connect(); await flush();
  assert.equal(h.latest().matches[0].currentplayerIndex, 1);
  data = { scope: { ...scope, finished: true }, matches: [] };
  client.connect(); await flush();
  assert.equal(h.latest().connection, 'idle');
  assert.equal(client.stopped, true);
});

test('socket updates win over slower snapshots, and pause cancels pending work and subscriptions', async t => {
  let resolveSnapshot;
  let calls = 0;
  const h = harness(t, async () => ++calls === 1 ? Response.json(snapshot()) : new Promise(resolve => { resolveSnapshot = resolve; }));
  h.scores.start(); await flush();
  const client = h.clients[0];
  client.connect();
  client.message({ match: raw({ matchPlayers: [{ ...player(501, 0), points: 44 }, player(502, 1)] }) });
  resolveSnapshot(Response.json(snapshot())); await flush();
  assert.equal(h.latest().matches[0].matchPlayers[0].points, 44);
  client.connect();
  h.scores.stop();
  resolveSnapshot(Response.json(snapshot())); await flush();
  assert.equal(h.latest().connection, 'paused');
  assert.equal(client.stopped, true);
  client.message({ match: raw() });
  assert.equal(h.latest().connection, 'paused');
});

test('failed initial requests retry, and open fixtures detect the first live board without reloading', async t => {
  t.mock.timers.enable({ apis: ['setTimeout'] });
  let calls = 0;
  const h = harness(t, async () => ++calls === 1 ? new Response('', { status: 502 }) : Response.json(snapshot([])));
  h.scores.start(); await flush();
  assert.equal(h.latest().connection, 'error');
  assert.equal(h.clients.length, 0);
  t.mock.timers.tick(30000); await flush();
  const client = h.clients[0];
  client.connect(); await flush();
  client.message({ match: raw() });
  assert.equal(visibleBoards(h.latest().matches).length, 1);
  h.scores.stop();
  const before = calls;
  t.mock.timers.tick(60000); await flush();
  assert.equal(calls, before);
});
