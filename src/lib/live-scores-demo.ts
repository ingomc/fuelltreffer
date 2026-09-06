import type { LiveBoard, LiveMatchScope, LiveScoresState } from '../types/api';
import { applyLiveUpdate, canCheckout } from './live-scores';

// Only dynamically imported by the development preview; never contacts 3K.
export function createLiveScoresDemo(onChange: (state: LiveScoresState) => void) {
  const scope: LiveMatchScope = {
    database: '5', eventId: '1', matchId: '1', groupKey: '1',
    matchKeys: ['101', '102'], expectedActive: true, finished: false,
  };
  let timer: ReturnType<typeof setInterval> | undefined;
  let running = false;
  let disconnected = false;
  let visit = 0;
  let state: LiveScoresState;
  const emit = () => onChange({ ...state });

  function reset() {
    visit = 0;
    disconnected = false;
    state = {
      scope: { ...scope }, connection: 'live',
      matches: [
        { names: ['Marie Muster', 'Jonas Demo'], points: [144, 214] },
        { names: ['Lea Test', 'Tom Beispiel'], points: [301, 105] },
      ].map((fixture, index): LiveBoard => ({
        id: String(101 + index), matchKey: String(101 + index), board: String(index + 1),
        status: 1, currentplayerIndex: index, startplayerIndex: 0,
        mode: 'Best of 5 Legs', roundName: '1. Block · Einzel', lastUpdate: new Date().toISOString(),
        matchPlayers: fixture.names.map((playerName, playerIndex) => ({
          id: String(1001 + index * 2 + playerIndex), index: playerIndex, playerName,
          points: fixture.points[playerIndex], lastScore: playerIndex ? 60 : 100,
          darts: 15, legs: 1, sets: 0,
          scoreTotal: 1002 - fixture.points[playerIndex], dartsTotal: 33, liveDarts: [],
        })),
      })),
    };
  }

  function nextVisit() {
    if (disconnected || state.scope?.finished) return;
    visit++;
    for (const board of state.matches) {
      if (board.status !== 1) continue;
      const next = structuredClone(board);
      if (next.matchPlayers.some(player => player.points === 0)) {
        next.startplayerIndex = 1 - next.startplayerIndex;
        next.currentplayerIndex = next.startplayerIndex;
        next.matchPlayers.forEach(player => {
          player.points = 501;
          player.darts = 0;
          player.lastScore = null;
        });
      } else {
        const player = next.matchPlayers[next.currentplayerIndex];
        const score = canCheckout(player.points) ? player.points : [60, 100, 45, 85][visit % 4];
        const scored = score < player.points - 1 || score === player.points ? score : 0;
        player.points -= scored;
        player.lastScore = scored;
        player.darts += 3;
        player.dartsTotal += 3;
        player.scoreTotal += scored;
        if (player.points === 0) {
          player.legs++;
          if (player.legs === 3) next.status = 2;
        }
        next.currentplayerIndex = 1 - next.currentplayerIndex;
      }
      next.lastUpdate = new Date().toISOString();
      state.matches = applyLiveUpdate(state.matches, {
        match: { ...next, database: scope.database, groupKey: scope.groupKey },
      }, scope);
    }
    if (state.matches.every(board => board.status !== 1)) {
      state = { ...state, scope: { ...scope, finished: true }, connection: 'idle' };
    }
    emit();
  }

  reset();
  return {
    start() {
      if (running) return;
      running = true;
      state.connection = state.scope?.finished ? 'idle' : disconnected ? 'reconnecting' : 'live';
      emit();
      timer = setInterval(nextVisit, 3000);
    },
    stop() {
      running = false;
      clearInterval(timer);
    },
    nextVisit,
    toggleConnection() {
      disconnected = !disconnected;
      state.connection = disconnected ? 'reconnecting' : 'live';
      emit();
    },
    finishBoard() {
      state.matches = state.matches.map(board => board.board === '2' ? { ...board, status: 2 } : board);
      emit();
    },
    finish() {
      state = { ...state, scope: { ...scope, finished: true }, matches: [], connection: 'idle' };
      emit();
    },
    restart() {
      reset();
      emit();
    },
  };
}
