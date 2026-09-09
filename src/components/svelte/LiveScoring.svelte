<script>
  export let databaseId;
  export let matchId;
  let expanded = false;
  $: liveUrl = `https://live.3k-darts.com/event/${encodeURIComponent(databaseId)}/${encodeURIComponent(matchId)}`;
</script>

<section class="my-3 overflow-hidden rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800" aria-label="Live-Scoring">
  <div class="flex flex-wrap items-center justify-between gap-2 p-3">
    <button
      type="button"
      class="rounded-lg bg-red-700 px-4 py-2 font-semibold text-white hover:bg-red-800 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
      aria-expanded={expanded}
      aria-controls="live-scoring-panel"
      on:click={() => expanded = !expanded}
    >
      {expanded ? 'Live-Scoring schließen' : 'Live-Scoring öffnen'}
    </button>
    <a href={liveUrl} target="_blank" rel="noopener noreferrer" class="text-sm text-blue-700 underline dark:text-blue-300">
      Bei 3K öffnen ↗
    </a>
  </div>
  <div id="live-scoring-panel" hidden={!expanded}>
    {#if expanded}
      <p class="px-3 pb-3 text-sm text-gray-600 dark:text-gray-300">
        Die 3K-Ansicht aktualisiert sich automatisch. Falls sie leer bleibt, öffne sie über „Bei 3K öffnen“.
      </p>
      <iframe
        src={liveUrl}
        title="3K Live-Scoring dieses Spiels"
        class="block h-[75vh] min-h-[420px] w-full border-0 bg-gray-900"
        allow="fullscreen"
      ></iframe>
    {/if}
  </div>
</section>
