import { CURRENT_LEAGUE } from '../config/league';

let pendingTable = null;

/**
 * Loads the current league table once per page and shares the result between
 * the dashboard widgets that need it.
 */
export function loadLeagueTableEntries() {
  if (!pendingTable) {
    // Phase 0 / round 0 returns the overall event table, as on the 3K portal's
    // table page; requests for the league phase itself return no entries.
    pendingTable = fetch(`/api/round/${CURRENT_LEAGUE.eventId}/0/0/table`)
      .then(response => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then(data => (data.tableEntries?.[0]?.tableEntries || []).map(entry => ({
        participantId: String(entry.participantId),
        position: parseInt(entry.placement),
        team: entry.participantName,
        games: entry.matchCount,
        wins: entry.win,
        draws: entry.tie,
        losses: entry.lost,
        points: entry.points1,
        sets: `${entry.sets1}:${entry.sets2}`,
        setDiff: entry.sets1 - entry.sets2,
        legs: `${entry.legs1}:${entry.legs2}`,
        legDiff: entry.legs1 - entry.legs2
      })))
      .catch(error => {
        pendingTable = null;
        throw error;
      });
  }
  return pendingTable;
}
