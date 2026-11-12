<script>
  import Icon from './Icon.svelte';
  import { getMatchOutcome } from '../../lib/match-utils';

  export let matches = [];
  export let participantId = '';
  export let participant = null;
  export let tableEntry = null;
  export let tableSize = 0;
  export let tableLoading = false;

  // Fall back to the participant's own matches when the table is unavailable.
  $: outcomes = matches.map(match => getMatchOutcome(match, participantId)).filter(Boolean);
  $: record = tableEntry
    ? { wins: tableEntry.wins, games: tableEntry.games }
    : { wins: outcomes.filter(outcome => outcome === 'win').length, games: outcomes.length };
  $: position = tableEntry?.position || participant?.rankingPos || null;
  $: winRate = record.games > 0 ? Math.round((record.wins / record.games) * 100) : null;
  $: setDiff = tableEntry?.setDiff ?? 0;

  $: stats = [
    {
      label: 'Tabellenplatz', icon: 'trophy', loading: tableLoading && !position,
      value: position ? `${position}.` : '–',
      sub: tableSize ? `von ${tableSize} Teams` : 'Aktuelle Platzierung'
    },
    {
      label: 'Punkte', icon: 'star', loading: tableLoading,
      value: tableEntry ? tableEntry.points : '–',
      sub: tableEntry ? `aus ${tableEntry.games} ${tableEntry.games === 1 ? 'Spiel' : 'Spielen'}` : 'Noch keine Tabelle'
    },
    {
      label: 'Siegquote', icon: 'chart-line', loading: tableLoading,
      value: winRate === null ? '–' : `${winRate} %`,
      sub: record.games
        ? `${record.wins} ${record.wins === 1 ? 'Sieg' : 'Siege'} in ${record.games} ${record.games === 1 ? 'Spiel' : 'Spielen'}`
        : 'Noch keine Ergebnisse'
    },
    {
      label: 'Sets', icon: 'target', loading: tableLoading,
      value: tableEntry ? tableEntry.sets : '–',
      note: tableEntry ? `${setDiff > 0 ? '+' : ''}${setDiff}` : '',
      noteClass: setDiff > 0 ? 'text-win-700 dark:text-win-400' : setDiff < 0 ? 'text-loss-700 dark:text-loss-400' : 'dimmed',
      sub: 'Satzverhältnis'
    }
  ];
</script>

<div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
  {#each stats as stat}
    <div class="paper flex min-w-0 flex-col gap-2.5 p-4">
      <div class="flex items-center justify-between gap-2">
        <span class="label truncate">{stat.label}</span>
        <span class="shrink-0 text-gray-600 dark:text-dark-200"><Icon name={stat.icon} size={22} strokeWidth={1.5} /></span>
      </div>
      {#if stat.loading}
        <div class="skeleton h-7 w-16"></div>
        <div class="skeleton h-3.5 w-24"></div>
      {:else}
        <div class="flex items-baseline gap-2.5">
          <span class="heading text-[28px] font-bold leading-none tabular-nums">{stat.value}</span>
          {#if stat.note}
            <span class="text-sm font-semibold tabular-nums {stat.noteClass}">{stat.note}</span>
          {/if}
        </div>
        <span class="dimmed text-xs">{stat.sub}</span>
      {/if}
    </div>
  {/each}
</div>
