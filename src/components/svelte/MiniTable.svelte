<script>
  import Icon from './Icon.svelte';
  import { getShortTeamName } from '../../lib/match-utils';

  export let entries = [];
  export let currentParticipantId = '';
  export let loading = false;
  export let onShowAll = () => {};

  $: currentIndex = entries.findIndex(entry => entry.participantId === String(currentParticipantId));
  $: start = Math.max(0, Math.min(currentIndex - 2, entries.length - 5));
  $: visible = currentIndex === -1 ? entries.slice(0, 5) : entries.slice(start, start + 5);
</script>

<div class="card overflow-hidden">
  <div class="card-header">
    <p class="eyebrow">Tabellenausschnitt</p>
    <button type="button" class="link inline-flex items-center gap-1 text-xs" on:click={onShowAll}>
      Ganze Tabelle <Icon name="chevron-right" size={13} />
    </button>
  </div>
  {#if loading}
    <div class="space-y-3 p-4">
      {#each Array(5) as _}<div class="skeleton h-5 w-full"></div>{/each}
    </div>
  {:else if visible.length === 0}
    <p class="p-4 text-sm text-zinc-500 dark:text-zinc-400">Noch keine Tabelle verfügbar.</p>
  {:else}
    <ol class="divide-y divide-zinc-100 dark:divide-white/[0.05]">
      {#each visible as entry}
        {@const own = entry.participantId === String(currentParticipantId)}
        <li class="relative flex items-center gap-3 px-4 py-2.5 text-sm {own ? 'bg-brand-50/80 dark:bg-brand-500/10' : ''}">
          {#if own}<span class="absolute inset-y-1.5 left-0 w-0.5 rounded-full bg-brand-500"></span>{/if}
          <span class="num w-5 text-right font-semibold {own ? 'text-brand-600 dark:text-brand-300' : 'text-zinc-400'}">{entry.position}</span>
          <span class="min-w-0 flex-1 truncate {own ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-700 dark:text-zinc-300'}" title={entry.team}>{getShortTeamName({ id: entry.participantId, displayName: entry.team })}</span>
          <span class="num w-6 text-right text-xs text-zinc-400">{entry.games}</span>
          <span class="num w-7 text-right font-bold text-zinc-900 dark:text-white">{entry.points}</span>
        </li>
      {/each}
    </ol>
  {/if}
</div>
