<script>
  import { getMatchOutcome, getRecentForm, OUTCOME_LABELS } from '../../lib/match-utils';

  export let matches = [];
  export let participantId = '';
  export let tableEntry = null;

  const fills = {
    win: 'bg-win-700',
    loss: 'bg-loss-700',
    draw: 'bg-gray-700 dark:bg-dark-300'
  };

  // Oldest first, so the most recent match sits on the right
  $: form = getRecentForm(matches, participantId, 5).reverse();
  $: outcomes = matches.map(match => getMatchOutcome(match, participantId)).filter(Boolean);
  $: record = tableEntry
    ? { win: tableEntry.wins, draw: tableEntry.draws, loss: tableEntry.losses }
    : {
      win: outcomes.filter(outcome => outcome === 'win').length,
      draw: outcomes.filter(outcome => outcome === 'draw').length,
      loss: outcomes.filter(outcome => outcome === 'loss').length
    };
  $: legend = [
    { key: 'win', count: record.win, label: record.win === 1 ? 'Sieg' : 'Siege' },
    { key: 'draw', count: record.draw, label: 'Remis' },
    { key: 'loss', count: record.loss, label: record.loss === 1 ? 'Niederlage' : 'Niederlagen' }
  ];
  $: hasRecord = record.win + record.draw + record.loss > 0;
</script>

<section class="paper flex flex-col gap-3.5 p-5">
  <div class="flex items-baseline justify-between gap-3">
    <h2 class="paper-title">Form</h2>
    {#if form.length > 0}
      <span class="dimmed text-xs">Letzte {form.length} Spiele, neuestes rechts</span>
    {/if}
  </div>

  {#if form.length > 0}
    <div class="flex gap-1.5">
      {#each form as entry}
        <span
          class="flex h-[30px] w-[30px] items-center justify-center rounded-full text-xs font-bold text-white {fills[entry.outcome]}"
          title="{OUTCOME_LABELS[entry.outcome].long}: {entry.match.participantHome?.displayName} – {entry.match.participantGuest?.displayName}"
        >{OUTCOME_LABELS[entry.outcome].short}</span>
      {/each}
    </div>
  {:else}
    <p class="dimmed">Noch keine Ergebnisse.</p>
  {/if}

  {#if hasRecord}
    <div class="flex h-2 gap-0.5" aria-hidden="true">
      {#each legend.filter(item => item.count > 0) as item}
        <span class="rounded-full {fills[item.key]}" style="flex: {item.count} 1 0"></span>
      {/each}
    </div>
    <div class="flex flex-wrap gap-x-4 gap-y-1.5 text-[13px]">
      {#each legend as item}
        <span class="inline-flex items-center gap-1.5">
          <span aria-hidden="true" class="h-2.5 w-2.5 rounded-full {fills[item.key]}"></span>
          {item.count} {item.label}
        </span>
      {/each}
    </div>
  {/if}
</section>
