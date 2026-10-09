<script>
  import Icon from './Icon.svelte';

  export let databaseId;
  export let matchId;
  let expanded = false;
  $: liveUrl = `https://live.3k-darts.com/event/${encodeURIComponent(databaseId)}/${encodeURIComponent(matchId)}`;
</script>

<section class="card overflow-hidden" aria-label="Live-Scoring">
  <div class="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-4">
    <div class="flex items-center gap-3">
      <span class="relative flex h-10 w-10 items-center justify-center rounded-xl bg-loss-50 text-loss-600 dark:bg-loss-500/10 dark:text-loss-400">
        <Icon name="radio" size={18} />
      </span>
      <div class="leading-tight">
        <p class="text-sm font-semibold text-zinc-900 dark:text-white">Live-Scoring</p>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">Wurf für Wurf über 3K Darts</p>
      </div>
    </div>
    <div class="flex items-center gap-2">
      <a href={liveUrl} target="_blank" rel="noopener noreferrer" class="btn-ghost px-3 text-xs">
        Bei 3K öffnen <Icon name="external" size={13} />
      </a>
      <button
        type="button"
        class="btn bg-loss-600 text-white shadow-sm hover:bg-loss-500 dark:bg-loss-500 dark:hover:bg-loss-400"
        aria-expanded={expanded}
        aria-controls="live-scoring-panel"
        on:click={() => expanded = !expanded}
      >
        {#if !expanded}<span class="h-2 w-2 animate-pulse rounded-full bg-white"></span>{/if}
        {expanded ? 'Live-Scoring schließen' : 'Live-Scoring öffnen'}
      </button>
    </div>
  </div>
  <div id="live-scoring-panel" hidden={!expanded} class="border-t border-zinc-100 dark:border-white/[0.06]">
    {#if expanded}
      <p class="px-4 py-3 text-xs text-zinc-500 dark:text-zinc-400">
        Die 3K-Ansicht aktualisiert sich automatisch. Falls sie leer bleibt, öffne sie über „Bei 3K öffnen“.
      </p>
      <iframe
        src={liveUrl}
        title="3K Live-Scoring dieses Spiels"
        class="block h-[75vh] min-h-[420px] w-full border-0 bg-zinc-950"
        allow="fullscreen"
      ></iframe>
    {/if}
  </div>
</section>
