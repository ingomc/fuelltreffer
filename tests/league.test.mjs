import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CURRENT_LEAGUE, findLeagueTeam } from '../src/config/league.ts';

test('only teams of the current league are accepted as team parameter', () => {
  assert.equal(findLeagueTeam(CURRENT_LEAGUE.defaultParticipantId)?.shortName, 'Fülltreffer');
  for (const value of ['999', '', '../event/24970', '633505/..', null, undefined]) {
    assert.equal(findLeagueTeam(value), null);
  }
});
