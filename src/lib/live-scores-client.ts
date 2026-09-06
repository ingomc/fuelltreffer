import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import type { StompConfig } from '@stomp/stompjs';
import type { LiveMatchScope, LiveScoresState, LiveSnapshot } from '../types/api';
import { applyLiveUpdate, LIVE_API_URL, resultKey } from './live-scores.ts';

type LiveClient = Pick<Client, 'activate' | 'deactivate' | 'subscribe' | 'connected'>;

export function createLiveScores(options: {
  eventId: string;
  matchId: string;
  onChange: (state: LiveScoresState) => void;
  onResultChange: () => void;
  fetcher?: typeof fetch;
  clientFactory?: (config: StompConfig) => LiveClient;
}) {
  const fetcher = options.fetcher ?? fetch;
  const clientFactory = options.clientFactory ?? (config => new Client(config));
  let state: LiveScoresState = { scope: null, matches: [], connection: 'connecting' };
  let stopped = true;
  let client: LiveClient | null = null;
  let clientKey = '';
  let pending: AbortController | null = null;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let revision = 0;
  let hasSnapshot = false;
  const emit = () => options.onChange({ ...state });

  function disconnect() {
    const previous = client;
    client = null;
    clientKey = '';
    void previous?.deactivate({ force: true });
  }

  function connect(scope: LiveMatchScope) {
    const key = `${scope.database}-${scope.groupKey}`;
    if (client && clientKey === key) return;
    disconnect();
    clientKey = key;
    const current = clientFactory({
      // Same transport as 3K Live: WebSocket first, HTTP fallback if necessary.
      webSocketFactory: () => new SockJS(`${LIVE_API_URL}/websocket`),
      connectionTimeout: 10000,
      reconnectDelay: 5000,
      heartbeatIncoming: 10000,
      heartbeatOutgoing: 10000,
      discardWebsocketOnCommFailure: true,
      onConnect: () => {
        if (stopped || client !== current) return;
        current.subscribe(`/topic/${key}`, message => {
          if (stopped || client !== current || !state.scope) return;
          try {
            const matches = applyLiveUpdate(state.matches, JSON.parse(message.body), state.scope);
            if (matches === state.matches) return;
            const changed = resultKey(matches) !== resultKey(state.matches);
            revision++;
            state = { ...state, matches, connection: 'live' };
            emit();
            if (changed) options.onResultChange();
          } catch {
            // A malformed message must not take down the report or the subscription.
          }
        });
        // Resynchronise after subscribing, including throws missed during reconnect.
        void refresh();
      },
      onWebSocketClose: () => {
        if (stopped || client !== current) return;
        state = { ...state, connection: 'reconnecting' };
        emit();
      },
      onStompError: () => {
        if (stopped || client !== current) return;
        state = { ...state, connection: 'error' };
        emit();
      },
    });
    client = current;
    current.activate();
  }

  async function refresh() {
    if (stopped || pending) return;
    clearTimeout(timer);
    const request = new AbortController();
    pending = request;
    const beforeRevision = revision;
    try {
      const response = await fetcher(`/api/match/${options.eventId}/${options.matchId}/live`, {
        signal: AbortSignal.any([request.signal, AbortSignal.timeout(20000)]), cache: 'no-store',
      });
      if (!response.ok) throw new Error('Live scores unavailable');
      const snapshot: LiveSnapshot = await response.json();
      if (!Array.isArray(snapshot.matches) || !('scope' in snapshot)) throw new Error('Invalid live scores');
      if (stopped || request.signal.aborted) return;
      // Never overwrite a more recent socket message with a slower HTTP snapshot.
      const matches = beforeRevision === revision || snapshot.scope?.finished ? snapshot.matches : state.matches;
      const changed = hasSnapshot && (resultKey(matches) !== resultKey(state.matches) ||
        (!!snapshot.scope?.finished && !state.scope?.finished));
      state = {
        scope: snapshot.scope, matches,
        connection: snapshot.scope?.finished || !snapshot.scope ? 'idle' : client?.connected ? 'live' : 'connecting',
      };
      hasSnapshot = true;
      if (!snapshot.scope || snapshot.scope.finished) disconnect();
      emit();
      if (changed) options.onResultChange();
    } catch {
      if (!stopped && !request.signal.aborted) {
        state = { ...state, connection: 'error' };
        emit();
      }
    } finally {
      if (pending === request) {
        pending = null;
        if (!stopped && !state.scope?.finished) {
          timer = setTimeout(() => void refresh(), 30000);
          if (state.scope) connect(state.scope);
        }
      }
    }
  }

  return {
    start() {
      if (!stopped) return;
      stopped = false;
      state = { ...state, connection: 'connecting' };
      emit();
      void refresh();
    },
    stop() {
      stopped = true;
      clearTimeout(timer);
      pending?.abort();
      pending = null;
      disconnect();
      state = { ...state, connection: 'paused' };
      emit();
    },
  };
}
