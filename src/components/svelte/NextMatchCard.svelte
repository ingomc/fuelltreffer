<script>
  import Icon from './Icon.svelte';
  import { trackDartEvents } from '/src/utils/umami.js';
  import {
    getNextMatch, isLiveMatch, isSameId, formatLongDate, formatRelativeDay, getDateParts, getInitials, getAvatarStyle
  } from '../../lib/match-utils';

  export let matches = [];
  export let currentParticipantId = '';

  $: nextMatch = getNextMatch(matches);
  $: live = nextMatch && isLiveMatch(nextMatch);
  $: isHome = nextMatch && isSameId(nextMatch.participantHome?.id, currentParticipantId);
  $: reportUrl = nextMatch
    ? `/match/${nextMatch.eventId}/${nextMatch.id}/report${currentParticipantId ? `?team=${currentParticipantId}` : ''}`
    : '#';
</script>

<div class="card relative overflow-hidden">
  <div class="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-brand-500/10 to-transparent dark:from-brand-500/15" aria-hidden="true"></div>
  <div class="relative p-4 sm:p-5">
    <div class="flex items-center justify-between gap-2">
      <p class="eyebrow">{live ? 'Gerade live' : 'Nächstes Spiel'}</p>
      {#if nextMatch}
        {#if live}
          <span class="chip border-loss-200 bg-loss-50 text-loss-700 dark:border-loss-500/30 dark:bg-loss-500/10 dark:text-loss-300">
            <span class="relative flex h-2 w-2"><span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-loss-500 opacity-75"></span><span class="relative inline-flex h-2 w-2 rounded-full bg-loss-500"></span></span>
            Live
          </span>
        {:else}
          <span class="chip border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">{formatRelativeDay(nextMatch.datePlanned)}</span>
        {/if}
      {/if}
    </div>

    {#if nextMatch}
      <div class="mt-4 space-y-2.5">
        {#each [nextMatch.participantHome, nextMatch.participantGuest] as team, index}
          {@const own = isSameId(team?.id, currentParticipantId)}
          <div class="flex items-center gap-3">
            <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-xs font-bold text-white {getAvatarStyle(team?.displayName)}">{getInitials(team?.displayName)}</span>
            <span class="min-w-0 flex-1 truncate text-[15px] {own ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'}">{team?.displayName || 'Unbekannt'}</span>
            {#if index === 0}
              <span class="text-[10px] font-semibold uppercase tracking-wider text-zinc-400">Heim</span>
            {/if}
          </div>
        {/each}
      </div>

      <div class="mt-4 flex items-center gap-2 rounded-xl bg-zinc-50 px-3 py-2.5 text-sm text-zinc-600 dark:bg-white/[0.04] dark:text-zinc-300">
        <Icon name="calendar" size={15} class="text-zinc-400" />
        <span class="min-w-0 flex-1 truncate">{formatLongDate(nextMatch.datePlanned)}</span>
        <span class="num font-semibold text-zinc-900 dark:text-white">{getDateParts(nextMatch.datePlanned).time}</span>
      </div>
      <p class="mt-2 flex items-center gap-1.5 text-xs text-zinc-500 dark:text-zinc-400">
        <Icon name={isHome ? 'home' : 'arrow-right'} size={13} />
        {isHome ? 'Heimspiel' : 'Auswärtsspiel'}
      </p>

      <a
        href={reportUrl}
        class="{live ? 'btn-primary bg-loss-600 hover:bg-loss-500 dark:bg-loss-500 dark:hover:bg-loss-400' : 'btn-secondary'} mt-4 w-full"
        on:click={() => trackDartEvents.matchView(nextMatch.id, nextMatch.eventId)}
      >
        <Icon name={live ? 'radio' : 'chevron-right'} size={15} />
        {live ? 'Live verfolgen' : 'Zum Spielbericht'}
      </a>
    {:else}
      <div class="mt-4 rounded-xl border border-dashed border-zinc-200 px-4 py-6 text-center text-sm text-zinc-500 dark:border-white/10 dark:text-zinc-400">
        Keine offenen Spiele – die Saison ist durch.
      </div>
    {/if}
  </div>
</div>
