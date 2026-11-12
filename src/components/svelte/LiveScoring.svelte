<script>
  import Icon from './Icon.svelte';

  export let databaseId;
  export let matchId;
  let expanded = false;
  $: liveUrl = `https://live.3k-darts.com/event/${encodeURIComponent(databaseId)}/${encodeURIComponent(matchId)}`;
</script>

<section class="paper overflow-hidden" aria-label="Live-Scoring">
  <div class="flex flex-wrap items-center justify-between gap-3 p-4 sm:px-5">
    <div class="flex items-center gap-3">
      <span class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-xl bg-brand-700/10 text-brand-700 dark:bg-brand-700/25 dark:text-brand-300">
        <Icon name="radio" size={20} strokeWidth={1.6} />
      </span>
      <div class="leading-tight">
        <p class="heading font-semibold">Live-Scoring</p>
        <p class="dimmed text-xs">Wurf für Wurf über 3K Darts</p>
      </div>
    </div>
    <div class="flex flex-wrap items-center gap-2">
      <a href={liveUrl} target="_blank" rel="noopener noreferrer" class="btn-subtle px-3">
        Bei 3K öffnen <Icon name="external" size={14} strokeWidth={1.6} />
      </a>
      <button
        type="button"
        class="btn-filled"
        aria-expanded={expanded}
        aria-controls="live-scoring-panel"
        on:click={() => expanded = !expanded}
      >
        {expanded ? 'Live-Scoring schließen' : 'Live-Scoring öffnen'}
      </button>
    </div>
  </div>
  <div id="live-scoring-panel" hidden={!expanded} class="divider border-t">
    {#if expanded}
      <p class="dimmed px-5 py-3 text-xs">
        Die 3K-Ansicht aktualisiert sich automatisch. Falls sie leer bleibt, öffne sie über „Bei 3K öffnen“.
      </p>
      <iframe
        src={liveUrl}
        title="3K Live-Scoring dieses Spiels"
        class="block h-[75vh] min-h-[420px] w-full border-0 bg-dark-900"
        allow="fullscreen"
      ></iframe>
    {/if}
  </div>
</section>
