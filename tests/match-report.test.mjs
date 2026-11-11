import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';

// Exercise the page's actual client loader and renderer with API responses.
const page = readFileSync(new URL('../src/pages/match/[eventId]/[matchId]/report.astro', import.meta.url), 'utf8');
const script = page.match(/<script define:vars=[^\n]+>\n([\s\S]*?)<\/script>/)[1]
  .replace('  fetchMatchReport();', '  globalThis.reportLoaded = fetchMatchReport();');
const summary = {
  id: 3876217,
  participantHome: { id: 632077, displayName: 'DC Condor Lautertal 2' },
  participantGuest: { id: 633505, displayName: 'SCO-Darts Team Fülltreffer' }
};
const games = [{
  id: 3876573,
  phase: { id: 42062 },
  round: { index: 2 },
  participantHome: { id: 674089, displayName: 'Adrian Sternitzke' },
  participantGuest: { id: 662437, displayName: 'Dominik Hohnhaus' },
  legsHome: 3, legsAway: 1,
  matchReportBlock: { blockIndex: 1, matchTypeCd: 'EZ', numberOfMatches: 4 }
}];

async function loadReport({ teamParam = null, initialMatchSummary = null, rosterOk = true, roundOk = true, report = games } = {}) {
  const elements = Object.fromEntries(['loading', 'error', 'error-message', 'content'].map(id => [id, {
    innerHTML: '', classList: { add() {}, remove() {} }
  }]));
  const requests = [];
  const context = {
    eventId: '24970', matchId: '3876217', teamParam, initialMatchSummary, tableRoundIndex: 0,
    window: {}, console: { error() {}, log() {} },
    document: { getElementById: id => elements[id] || null, querySelector: () => null },
    async fetch(url) {
      requests.push(url);
      if (url.endsWith('/report')) return Response.json(report);
      if (url.endsWith('/statistics')) return Response.json([]);
      if (url.startsWith('/api/participant/')) {
        return Response.json({ matches: [summary] }, { status: rosterOk ? 200 : 503 });
      }
      assert.equal(url, '/api/round/24970/42062/0');
      // Another fixture comes first: resolve by match ID, never list order.
      return Response.json({ matches: [{ ...summary, id: 1 }, { ...summary, id: String(summary.id) }] }, { status: roundOk ? 200 : 503 });
    }
  };
  runInNewContext(script, context);
  await context.reportLoaded;
  assert.equal(elements['error-message'].textContent, undefined);
  return { html: elements.content.innerHTML, requests };
}

function assertTeamHeaders(html) {
  const headers = html.split('<!-- Games in Block -->')[0];
  assert.match(headers, /DC Condor Lautertal 2/);
  assert.match(headers, /SCO-Darts Team Fülltreffer/);
  assert.doesNotMatch(headers, /Adrian Sternitzke|Dominik Hohnhaus/);
  assert.match(html, /Adrian Sternitzke/);
  assert.match(html, /Dominik Hohnhaus/);
  assert.match(html, /title="DC Condor Lautertal 2"/);
}

test('shared report without team parameter resolves team pairing from the league matches', async () => {
  const { html, requests } = await loadReport();
  assertTeamHeaders(html);
  assert.ok(requests.includes('/api/round/24970/42062/0'));
});

test('report with team parameter uses the roster pairing', async () => {
  const { html, requests } = await loadReport({ teamParam: '633505' });
  assertTeamHeaders(html);
  assert.ok(!requests.some(url => url.startsWith('/api/round/')));
});

test('failed roster request retains the server-rendered pairing', async () => {
  const { html, requests } = await loadReport({ teamParam: '633505', initialMatchSummary: summary, rosterOk: false });
  assertTeamHeaders(html);
  assert.ok(!requests.some(url => url.startsWith('/api/round/')));
});

test('failed roster request without server data falls back to the league pairing', async () => {
  assertTeamHeaders((await loadReport({ teamParam: '633505', rosterOk: false })).html);
});

test('unavailable pairing never labels teams with individual player names', async () => {
  const { html } = await loadReport({ roundOk: false });
  const headers = html.split('<!-- Games in Block -->')[0];
  assert.match(headers, /Heimteam/);
  assert.match(headers, /Gastteam/);
  assert.doesNotMatch(headers, /Adrian Sternitzke|Dominik Hohnhaus/);
  assert.match(html, /Adrian Sternitzke/);
});

test('empty report still displays the no-data state', async () => {
  assert.match((await loadReport({ report: [] })).html, /Keine Daten verfügbar/);
});
