import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isAllowedThreeKPath } from '../src/lib/threek-proxy.ts';

test('3k proxy only allows the story maker endpoints', () => {
  assert.ok(isAllowedThreeKPath('participant/633505'));
  assert.ok(isAllowedThreeKPath('event/24970'));
  assert.ok(isAllowedThreeKPath('event/24970/participant'));
  assert.ok(!isAllowedThreeKPath('participant/abc'));
  assert.ok(!isAllowedThreeKPath('event/24970/phase/0/round/0/table'));
  assert.ok(!isAllowedThreeKPath('../admin'));
  assert.ok(!isAllowedThreeKPath('participant/1/../../x'));
  assert.ok(!isAllowedThreeKPath(''));
});
