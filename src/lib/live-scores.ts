import type { LiveBoard, LiveMatchScope, LivePlayer } from '../types/api';

export const LIVE_API_URL = 'https://live.3k-darts.com/dartsscorer-liveticker/api/v1';
const finishedStatuses = new Set(['FINISH', 'FINISHED', 'ENDED', 'COMPLETE', 'CANCELLED']);
const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {};
const identifier = (value: unknown) => /^\d+$/.test(String(value)) && Number(value) > 0 ? String(value) : '';
const number = (value: unknown, fallback = 0) =>
  typeof value === 'number' && Number.isFinite(value) ? value : fallback;
const text = (value: unknown) => typeof value === 'string' ? value : '';

/** dbId is the portal database, not the number in the backend hostname. */
export function getLiveScope(payload: unknown, eventId: string, matchId: string): LiveMatchScope | null {
  if (!identifier(eventId) || !identifier(matchId) || !Array.isArray(payload) || !payload.length) return null;
  const games = payload.map(record);
  const first = games[0];
  const event = record(first.event);
  const database = identifier(first.dbId ?? event.dbId);
  if (!database || games.some(game => String(game.eventId) !== eventId || !identifier(game.id))) return null;
  return {
    database, eventId, matchId,
    // Team leagues publish under the parent fixture; tournaments under the event.
    groupKey: event.eventTypeCd === 'LEAGUE' || event.leagueOrLeagueTypeCd === true ? matchId : eventId,
    matchKeys: games.map(game => String(game.id)),
    finished: games.every(game => finishedStatuses.has(String(game.statusCd))),
    expectedActive: games.some(game => game.statusCd === 'ACTIVE'),
  };
}

export function belongsToMatch(value: unknown, scope: LiveMatchScope): boolean {
  const match = record(value);
  return String(match.database) === scope.database &&
    String(match.groupKey) === scope.groupKey &&
    scope.matchKeys.includes(String(match.matchKey)) &&
    (!match.originalEventId || String(match.originalEventId) === scope.eventId) &&
    (!match.teamParentMatchId || String(match.teamParentMatchId) === scope.matchId);
}

function parsePlayer(value: unknown): LivePlayer | null {
  const player = record(value);
  const id = identifier(player.id);
  if (!id || !text(player.playerName) || ![0, 1].includes(number(player.index, -1)) ||
      number(player.points, -1) < 0) return null;
  return {
    id, index: number(player.index), playerName: text(player.playerName), points: number(player.points),
    lastScore: typeof player.lastScore === 'number' ? number(player.lastScore) : null,
    darts: number(player.darts), legs: number(player.legs), sets: number(player.sets),
    scoreTotal: number(player.scoreTotal), dartsTotal: number(player.dartsTotal), liveDarts: [],
  };
}

function parseBoard(value: unknown): LiveBoard | null {
  const match = record(value);
  const players = Array.isArray(match.matchPlayers) ? match.matchPlayers.map(parsePlayer) : [];
  if (!identifier(match.id) || players.length !== 2 || players.some(player => !player) ||
      new Set(players.map(player => player?.index)).size !== 2 || ![0, 1, 2].includes(number(match.status, -1))) return null;
  return {
    id: String(match.id), matchKey: String(match.matchKey), board: text(match.board) || '–',
    status: number(match.status), currentplayerIndex: number(match.currentplayerIndex, -1),
    startplayerIndex: number(match.startplayerIndex, -1), mode: text(match.mode),
    roundName: text(match.roundName), lastUpdate: text(match.lastUpdate),
    matchPlayers: (players as LivePlayer[]).sort((a, b) => a.index - b.index),
  };
}

export function selectLiveMatches(payload: unknown, scope: LiveMatchScope): LiveBoard[] {
  const data = record(payload).data;
  if (!Array.isArray(data)) throw new Error('Invalid live-score response');
  return data.filter(match => belongsToMatch(match, scope)).map(parseBoard).filter((match): match is LiveBoard => !!match);
}

/** Full match messages replace transient darts; player messages contain a visit in progress. */
export function applyLiveUpdate(matches: LiveBoard[], payload: unknown, scope: LiveMatchScope): LiveBoard[] {
  const message = record(payload);
  if (message.match) {
    if (!belongsToMatch(message.match, scope)) return matches;
    const incoming = record(message.match);
    const previous = matches.find(match => match.id === String(incoming.id) || match.board === incoming.board);
    if (previous?.lastUpdate && text(incoming.lastUpdate) && previous.lastUpdate > text(incoming.lastUpdate)) return matches;
    if (incoming.status === 4) return matches.filter(match => match.id !== String(incoming.id));
    const next = parseBoard(incoming);
    return next ? [...matches.filter(match => match.id !== next.id && match.board !== next.board), next] : matches;
  }
  const player = record(message.matchPlayer);
  if (!identifier(player.id)) return matches;
  if (!matches.some(match => match.status === 1 && match.matchPlayers.some(existing => existing.id === String(player.id)))) return matches;
  return matches.map(match => match.status !== 1 ? match : {
    ...match,
    matchPlayers: match.matchPlayers.map(existing => existing.id !== String(player.id) ? existing : {
      ...existing,
      liveDarts: [player.dart1, player.dart2, player.dart3].filter((dart): dart is string => typeof dart === 'string' && !!dart),
    }),
  });
}

/** Select the latest game per physical board, retaining real board labels (e.g. 3 and 4). */
export function visibleBoards(matches: LiveBoard[]): LiveBoard[] {
  const boards = new Map<string, LiveBoard>();
  for (const match of [...matches].sort((a, b) => a.lastUpdate.localeCompare(b.lastUpdate))) {
    boards.set(match.board, match);
  }
  return [...boards.values()].filter(match => match.status === 1)
    .sort((a, b) => a.board.localeCompare(b.board, 'de', { numeric: true })).slice(0, 2);
}

export function dartValue(dart: string): number {
  const value = dart.toUpperCase();
  const multiplier = value.startsWith('D') ? 2 : value.startsWith('T') ? 3 : 1;
  const target = value.replace(/^[SDT]/, '');
  const points = target === 'BULL' ? 25 : Number(target);
  return Number.isFinite(points) && points >= 0 && (points <= 20 || points === 25) ? points * multiplier : 0;
}

export function playerAverage(player: LivePlayer): string {
  const darts = player.dartsTotal + player.liveDarts.length;
  const score = player.scoreTotal + player.liveDarts.reduce((sum, dart) => sum + dartValue(dart), 0);
  return darts > 0 ? (score / darts * 3).toFixed(1) : '–';
}

export function canCheckout(points: number): boolean {
  return points > 1 && points <= 170 && ![159, 162, 163, 165, 166, 168, 169].includes(points);
}

export function resultKey(matches: LiveBoard[]): string {
  return [...matches].sort((a, b) => a.id.localeCompare(b.id)).map(match =>
    `${match.id}:${match.status}:${match.matchPlayers.map(player => `${player.sets}/${player.legs}`).join(':')}`
  ).join('|');
}
