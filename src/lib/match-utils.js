// Helpers shared by the dashboard widgets for interpreting participant matches.
import { CURRENT_LEAGUE } from '../config/league';
import venueSnapshot from '../data/venues.snapshot.json';

const FINISHED_STATUSES = ['FINISHED', 'FINISH', 'ENDED', 'COMPLETE'];

export function getMatchStatus(match) {
  return match?.statusCd || match?.status || '';
}

export function isFinishedMatch(match) {
  return FINISHED_STATUSES.includes(getMatchStatus(match));
}

export function isLiveMatch(match) {
  return getMatchStatus(match) === 'ACTIVE';
}

export function isCancelledMatch(match) {
  return getMatchStatus(match) === 'CANCELLED';
}

/** Returns the final score as `[home, guest]` numbers, or null if unknown. */
export function getScorePair(match) {
  const scoreCandidates = [
    [match?.setsHome, match?.setsAway],
    [match?.legsHome, match?.legsAway],
    [match?.scoreHome, match?.scoreGuest],
    [match?.resultHome, match?.resultGuest],
    [match?.homeScore, match?.guestScore],
    [match?.homePoints, match?.guestPoints],
    [match?.participantHome?.score, match?.participantGuest?.score],
    [match?.participantHome?.points, match?.participantGuest?.points],
    [match?.participantHome?.result, match?.participantGuest?.result]
  ];

  const scorePair = scoreCandidates.find(([home, guest]) => home != null && guest != null);
  if (scorePair) {
    return [Number(scorePair[0]), Number(scorePair[1])];
  }

  for (const value of [match?.result, match?.score]) {
    if (typeof value === 'string' && value.includes(':')) {
      const [home, guest] = value.split(':').map(part => Number(part.trim()));
      if (!Number.isNaN(home) && !Number.isNaN(guest)) return [home, guest];
    }
  }

  return null;
}

export function isSameId(a, b) {
  return a != null && b != null && String(a) === String(b);
}

/** 'win' | 'loss' | 'draw' from the perspective of the given participant, or null. */
export function getMatchOutcome(match, participantId) {
  if (!isFinishedMatch(match)) return null;
  const score = getScorePair(match);
  if (!score) return null;
  const isHome = isSameId(match?.participantHome?.id, participantId);
  const isGuest = isSameId(match?.participantGuest?.id, participantId);
  if (!isHome && !isGuest) return null;
  const [own, other] = isHome ? score : [score[1], score[0]];
  if (own > other) return 'win';
  if (own < other) return 'loss';
  return 'draw';
}

export const OUTCOME_LABELS = {
  win: { short: 'S', long: 'Sieg' },
  loss: { short: 'N', long: 'Niederlage' },
  draw: { short: 'U', long: 'Unentschieden' }
};

export function sortByDate(matches, direction = 'asc') {
  const factor = direction === 'asc' ? 1 : -1;
  return [...matches].sort((a, b) => (new Date(a.datePlanned).getTime() - new Date(b.datePlanned).getTime()) * factor);
}

/** Finished matches with a known result, most recent first. */
export function getRecentForm(matches, participantId, limit = 5) {
  return sortByDate(matches, 'desc')
    .map(match => ({ match, outcome: getMatchOutcome(match, participantId) }))
    .filter(entry => entry.outcome)
    .slice(0, limit);
}

export function getNextMatch(matches) {
  const pending = sortByDate(matches.filter(match => !isFinishedMatch(match) && !isCancelledMatch(match)));
  return pending.find(isLiveMatch) || pending[0] || null;
}

const WEEKDAYS_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

export function getDateParts(dateString) {
  const date = new Date(dateString);
  return {
    weekday: WEEKDAYS_SHORT[date.getDay()],
    day: date.toLocaleDateString('de-DE', { day: '2-digit' }),
    month: date.toLocaleDateString('de-DE', { month: 'short' }).replace('.', ''),
    time: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  };
}

export function formatLongDate(dateString) {
  return new Date(dateString).toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' });
}

/** Human readable distance in days, e.g. "Heute", "Morgen", "in 4 Tagen". */
export function formatRelativeDay(dateString, now = new Date()) {
  const startOfDay = (value) => new Date(value.getFullYear(), value.getMonth(), value.getDate()).getTime();
  const days = Math.round((startOfDay(new Date(dateString)) - startOfDay(now)) / 86400000);
  if (days === 0) return 'Heute';
  if (days === 1) return 'Morgen';
  if (days === -1) return 'Gestern';
  return days > 0 ? `in ${days} Tagen` : `vor ${-days} Tagen`;
}

export function getInitials(name = '') {
  const parts = name.replace(/[^\p{L}\p{N}\s]/gu, ' ').trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return '?';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/** Short team name from the league configuration, falling back to the display name. */
export function getShortTeamName(team) {
  return CURRENT_LEAGUE.teams.find(entry => isSameId(entry.id, team?.id))?.shortName || team?.displayName || '';
}

/** Compact date for list rows, e.g. { weekday: 'Fr', date: '13.11.', time: '18:00' }. */
export function formatShortDate(dateString) {
  const date = new Date(dateString);
  return {
    weekday: WEEKDAYS_SHORT[date.getDay()],
    date: date.toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' }),
    time: date.toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
  };
}

/** Name of a team's home venue from the checked-in venue snapshot, if known. */
export function getVenueName(teamId) {
  return venueSnapshot.teams.find(entry => isSameId(entry.teamId, teamId))?.venue?.name || '';
}
