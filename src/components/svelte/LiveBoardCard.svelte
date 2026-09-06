<script lang="ts">
  import type { LiveBoard } from '../../types/api';
  import { canCheckout, dartValue, playerAverage } from '../../lib/live-scores';

  export let board: LiveBoard | null = null;
  export let label: string;
  export let stale = false;
</script>

<article aria-label={label} class="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
  <header class="flex items-center justify-between gap-3 bg-blue-700 px-4 py-2.5 text-white dark:bg-blue-800">
    <h3 class="shrink-0 text-sm font-bold">{label}</h3>
    <div class="min-w-0 text-right text-xs">
      {#if board}
        <div class="font-semibold">{board.roundName || 'Laufendes Spiel'}</div>
        <div class="mt-0.5 text-blue-100">{board.mode}</div>
      {:else}
        <span class="text-blue-100">Wartet auf das nächste Spiel</span>
      {/if}
    </div>
  </header>
  {#if board}
    <div class="grid grid-cols-2 divide-x divide-gray-200 dark:divide-gray-700" class:opacity-60={stale}>
      {#each board.matchPlayers as player (player.id)}
        {@const active = board.currentplayerIndex === player.index}
        {@const lastScore = player.liveDarts.length ? player.liveDarts.reduce((sum, dart) => sum + dartValue(dart), 0) : player.lastScore}
        <div class="flex min-w-0 flex-col">
          <div class="relative flex flex-1 flex-col px-3 pb-3 pt-2" class:active-player={active && !stale}>
            <div class="mb-1 flex min-h-5 items-center justify-between gap-1 text-[10px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">
              <span class:throwing={active && !stale}>{active ? 'Am Wurf' : ' '}</span>
              {#if board.startplayerIndex === player.index}
                <span title="Hat dieses Leg begonnen" aria-label="Hat dieses Leg begonnen">● Anwurf</span>
              {/if}
            </div>
            <div class="min-h-12 flex-1 break-words text-center text-base font-bold leading-6 text-gray-900 dark:text-white">{player.playerName}</div>
            <div class="mt-1 text-center">
              <span class="block text-[10px] uppercase tracking-wider text-gray-500 dark:text-gray-400">Rest</span>
              <strong class={`block ${player.points === 0 ? 'text-3xl' : 'text-5xl'} font-extrabold leading-tight tabular-nums text-gray-900 dark:text-white`} class:checkout={canCheckout(player.points)}>
                {player.points === 0 ? 'Check' : player.points}
              </strong>
            </div>
            <div class="mt-1 text-center text-xs text-gray-500 dark:text-gray-400">
              {player.liveDarts.length ? 'Aufnahme' : 'Letzte Aufnahme'}
              <span class="ml-1 font-bold tabular-nums text-gray-700 dark:text-gray-200">{lastScore ?? '–'}</span>
            </div>
          </div>
          <dl class="grid grid-cols-3 gap-1 bg-gray-100 px-2 py-2.5 text-center text-xs dark:bg-gray-700/60">
            <div><dt class="text-gray-500 dark:text-gray-400">Darts</dt><dd class="mt-1 font-bold tabular-nums text-gray-900 dark:text-white">{player.darts + player.liveDarts.length}</dd></div>
            <div><dt class="text-gray-500 dark:text-gray-400">Avg</dt><dd class="mt-1 font-bold tabular-nums text-gray-900 dark:text-white">{playerAverage(player)}</dd></div>
            <div><dt class="text-gray-500 dark:text-gray-400">Legs</dt><dd class="mt-1 font-bold tabular-nums text-gray-900 dark:text-white">{player.legs}</dd></div>
          </dl>
        </div>
      {/each}
    </div>
  {:else}
    <div class="flex min-h-64 items-center justify-center px-6 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      Sobald das Spiel am Board startet,<br />erscheint hier der Live-Score.
    </div>
  {/if}
</article>

<style>
  .active-player { box-shadow: inset 0 0 0 2px #2563eb; background: rgb(59 130 246 / 0.06); }
  .throwing { color: #1d4ed8; }
  .checkout { color: #15803d; }
  :global(.dark) .throwing { color: #93c5fd; }
  :global(.dark) .checkout { color: #4ade80; }
</style>
