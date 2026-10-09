import { CURRENT_LEAGUE } from '../config/league';

let pendingTable = null;

/**
 * Loads the current league table once per page and shares the result between
 * the dashboard widgets that need it.
 */
export function loadLeagueTableEntries() {
  if (!pendingTable) {
    const { eventId, phaseId, tableRoundIndex } = CURRENT_LEAGUE;
    pendingTable = fetch(`/api/round/${eventId}/${phaseId}/${tableRoundIndex}/table`)
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
