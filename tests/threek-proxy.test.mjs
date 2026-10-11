import { test } from 'node:test';
import assert from 'node:assert/strict';
import { allowedThreeKQuery, isAllowedThreeKPath } from '../src/lib/threek-proxy.ts';

test('3k proxy only allows the story maker endpoints', () => {
  assert.ok(isAllowedThreeKPath('participant/633505'));
  assert.ok(isAllowedThreeKPath('event/24970'));
  assert.ok(isAllowedThreeKPath('event/24970/participant'));
  assert.ok(isAllowedThreeKPath('event/24970/match/3876204/report'));
  assert.ok(isAllowedThreeKPath('event/24970/performance/match/3876204'));
  assert.ok(!isAllowedThreeKPath('participant/abc'));
  assert.ok(!isAllowedThreeKPath('event/24970/phase/0/round/0/table'));
  assert.ok(!isAllowedThreeKPath('event/24970/match/3876204/statistics'));
  assert.ok(!isAllowedThreeKPath('../admin'));
  assert.ok(!isAllowedThreeKPath('participant/1/../../x'));
  assert.ok(!isAllowedThreeKPath(''));
});

test('3k proxy forwards only the allowed query', () => {
  const q = (s) => new URLSearchParams(s);
  assert.equal(allowedThreeKQuery('event/24970/performance/match/1', q('matchReport=1')), '?matchReport=1');
  assert.equal(allowedThreeKQuery('event/24970/performance/match/1', q('matchReport=1&x=evil')), '?matchReport=1');
  assert.equal(allowedThreeKQuery('event/24970/performance/match/1', q('matchReport=2')), '');
  assert.equal(allowedThreeKQuery('participant/633505', q('matchReport=1')), '');
});
