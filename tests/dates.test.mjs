import { test } from 'node:test';
import assert from 'node:assert/strict';

// The helpers must not depend on the machine's time zone (the container runs in UTC).
process.env.TZ = 'America/Los_Angeles';
const { formatLongDate, formatRelativeDay, formatShortDate } = await import('../src/lib/dates.js');

test('match times are shown in league time, in winter and in summer', () => {
  assert.deepEqual(formatShortDate('2026-11-27T17:30:00Z'), { weekday: 'Fr', date: '27.11.', time: '18:30' });
  assert.deepEqual(formatShortDate('2026-06-12T16:00:00Z'), { weekday: 'Fr', date: '12.06.', time: '18:00' });
});

test('the calendar day follows league time around midnight', () => {
  assert.deepEqual(formatShortDate('2026-11-27T23:30:00Z'), { weekday: 'Sa', date: '28.11.', time: '00:30' });
  assert.equal(formatLongDate('2026-11-27T23:30:00Z'), 'Samstag, 28. November');
  assert.equal(formatLongDate('2026-09-09T16:00:00Z'), 'Mittwoch, 9. September');
});

test('relative days are counted between league calendar days', () => {
  const lateEvening = new Date('2026-11-12T22:30:00Z'); // 23:30 in the league
  const afterMidnight = new Date('2026-11-12T23:30:00Z'); // already the 13th in the league
  assert.equal(formatRelativeDay('2026-11-27T17:30:00Z', lateEvening), 'in 15 Tagen');
  assert.equal(formatRelativeDay('2026-11-27T17:30:00Z', afterMidnight), 'in 14 Tagen');
  assert.equal(formatRelativeDay('2026-11-13T17:00:00Z', afterMidnight), 'Heute');
  assert.equal(formatRelativeDay('2026-11-14T17:00:00Z', afterMidnight), 'Morgen');
  assert.equal(formatRelativeDay('2026-11-12T17:00:00Z', afterMidnight), 'Gestern');
  assert.equal(formatRelativeDay('2026-11-06T17:00:00Z', afterMidnight), 'vor 7 Tagen');
});

test('missing or invalid dates render placeholders instead of throwing', () => {
  assert.deepEqual(formatShortDate(undefined), { weekday: '', date: '–', time: '–' });
  assert.equal(formatLongDate('kein Datum'), 'Termin offen');
  assert.equal(formatRelativeDay(null), '');
});
