<script lang="ts">
  import { onMount } from 'svelte';
  import type { LiveScoresState } from '../../types/api';
  import { visibleBoards } from '../../lib/live-scores';
  import { createLiveScores } from '../../lib/live-scores-client';
  import LiveBoardCard from './LiveBoardCard.svelte';

  export let eventId: string;
  export let matchId: string;
  export let demo = false;
  let demoControls: ReturnType<typeof import('../../lib/live-scores-demo').createLiveScoresDemo> | null = null;
  let state: LiveScoresState = { scope: null, matches: [], connection: 'connecting' };
  let hadLive = false;

  $: boards = visibleBoards(state.matches);
  $: if (boards.length) hadLive = true;
  $: stale = state.connection !== 'live';
  $: show = !state.scope?.finished && (boards.length > 0 || state.scope?.expectedActive || hadLive || state.connection === 'error');
  $: waitingBoard = state.matches.find(match => !boards.some(board => board.board === match.board))?.board ||
    (boards[0]?.board === '1' ? '2' : boards[0]?.board === '2' ? '1' : null);
  $: slots = [
    ...boards.map(board => ({ board, label: `Board ${board.board}` })),
    ...(boards.length < 2 ? [{ board: null, label: boards.length ? (waitingBoard ? `Board ${waitingBoard}` : 'Weiteres Board') : 'Board 1' }] : []),
    ...(boards.length === 0 ? [{ board: null, label: 'Board 2' }] : []),
  ].sort((a, b) => a.label.localeCompare(b.label, 'de', { numeric: true }));

  onMount(() => {
    let disposed = false;
    let scores: { start: () => void; stop: () => void } | undefined;
    const visibilityChanged = () => document.hidden ? scores?.stop() : scores?.start();
    const pause = () => scores?.stop();
    async function initialize() {
      if (import.meta.env.DEV && demo) {
        const { createLiveScoresDemo } = await import('../../lib/live-scores-demo');
        if (disposed) return;
        demoControls = createLiveScoresDemo(next => { state = next; });
        scores = demoControls;
      } else {
        scores = createLiveScores({
          eventId, matchId,
          onChange: next => { state = next; },
          onResultChange: () => document.dispatchEvent(new CustomEvent('match-live-result')),
        });
      }
      visibilityChanged();
    }
    document.addEventListener('visibilitychange', visibilityChanged);
    window.addEventListener('pagehide', pause);
    window.addEventListener('pageshow', visibilityChanged);
    void initialize().catch(() => { if (!disposed) state = { ...state, connection: 'error' }; });
    return () => {
      disposed = true;
      scores?.stop();
      document.removeEventListener('visibilitychange', visibilityChanged);
      window.removeEventListener('pagehide', pause);
      window.removeEventListener('pageshow', visibilityChanged);
    };
  });
</script>

{#if import.meta.env.DEV && demo}
  <aside aria-label="Teststeuerung" class="my-5 space-y-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
    <p class="font-bold">Testmodus · simulierte Daten</p>
    <p class="text-sm">Alle drei Sekunden wird eine Aufnahme simuliert. Die Karten verwenden dieselbe Anzeige wie im Spielbericht. Es werden keine Daten an 3K Darts gesendet.</p>
    <div class="flex flex-wrap gap-2">
      <button class="demo-button" disabled={!demoControls || stale || state.scope?.finished} on:click={() => demoControls?.nextVisit()}>Nächste Aufnahme</button>
      <button class="demo-button" disabled={!demoControls || state.scope?.finished} on:click={() => demoControls?.toggleConnection()}>{state.connection === 'reconnecting' ? 'Wieder verbinden' : 'Verbindung unterbrechen'}</button>
      <button class="demo-button" disabled={!demoControls || state.scope?.finished} on:click={() => demoControls?.finishBoard()}>Board 2 beenden</button>
      <button class="demo-button" disabled={!demoControls || state.scope?.finished} on:click={() => demoControls?.finish()}>Begegnung beenden</button>
      <button class="demo-button" disabled={!demoControls} on:click={() => demoControls?.restart()}>Neu starten</button>
    </div>
    {#if state.scope?.finished}
      <p role="status" class="text-sm font-medium">Testbegegnung beendet. Die Live-Boards sind jetzt ausgeblendet. Mit „Neu starten“ beginnt die Vorschau erneut.</p>
    {/if}
  </aside>
{/if}

{#if show}
  <section aria-label="Live-Scores dieser Begegnung" class="my-4 space-y-3">
    <div class="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1">
      <div class="flex items-center gap-2.5">
        <span class="h-2.5 w-2.5 rounded-full" class:bg-emerald-500={!stale} class:bg-amber-500={stale}></span>
        <h2 class="text-lg font-bold text-gray-900 dark:text-white">Live am Board</h2>
      </div>
      {#if state.scope && !(import.meta.env.DEV && demo)}
        <a class="text-xs font-medium text-blue-700 hover:underline dark:text-blue-300" href={`https://live.3k-darts.com/event/${state.scope.database}/${state.scope.groupKey}`} target="_blank" rel="noopener noreferrer">Bei 3K Darts öffnen ↗</a>
      {/if}
    </div>
    <p role="status" class="px-1 text-xs text-gray-500 dark:text-gray-400">
      {#if state.connection === 'live'}
        {boards.length ? 'Live-Scores werden automatisch aktualisiert.' : 'Warten auf das nächste Spiel am Board.'}
      {:else if state.connection === 'error'}
        Live-Scores gerade nicht erreichbar. Neuer Versuch läuft automatisch.{boards.length ? ' Angezeigt ist der zuletzt empfangene Stand.' : ''}
      {:else if state.connection === 'reconnecting'}
        Verbindung unterbrochen. Verbindung wird wiederhergestellt. Angezeigt ist der letzte Stand.
      {:else if state.connection === 'paused'}
        Live-Anzeige pausiert.
      {:else}
        Verbindung zu den Live-Scores wird hergestellt …
      {/if}
    </p>
    {#if boards.length || state.scope?.expectedActive || hadLive}
      <div class="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {#each slots as slot (slot.label)}
          <LiveBoardCard board={slot.board} label={slot.label} {stale} />
        {/each}
      </div>
    {/if}
  </section>
{/if}

<style>
  .demo-button {
    @apply rounded-lg border border-amber-300 bg-white px-3 py-2 text-sm font-medium hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-40 dark:border-amber-700 dark:bg-gray-800 dark:hover:bg-gray-700;
  }
</style>
