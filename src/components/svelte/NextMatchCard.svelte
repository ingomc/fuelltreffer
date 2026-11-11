<script>
  import Icon from './Icon.svelte';
  import { trackDartEvents } from '/src/utils/umami.js';
  import {
    getNextMatch, isLiveMatch, isSameId, formatLongDate, formatRelativeDay, formatShortDate, getInitials, getVenueName
  } from '../../lib/match-utils';

  export let matches = [];
  export let currentParticipantId = '';

  $: nextMatch = getNextMatch(matches);
  $: live = nextMatch && isLiveMatch(nextMatch);
  $: venueName = nextMatch ? getVenueName(nextMatch.participantHome?.id) : '';
  $: reportUrl = nextMatch
    ? `/match/${nextMatch.eventId}/${nextMatch.id}/report${currentParticipantId ? `?team=${currentParticipantId}` : ''}`
    : '#';
</script>

<section class="paper flex flex-col gap-4 p-5">
  <div class="flex items-center justify-between gap-3">
    <h2 class="paper-title">{live ? 'Gerade live' : 'Nächstes Spiel'}</h2>
    {#if nextMatch}
      <span class="badge-brand">
        {#if live}<span class="h-1.5 w-1.5 animate-pulse rounded-full bg-current"></span>Live{:else}{formatRelativeDay(nextMatch.datePlanned)}{/if}
      </span>
    {/if}
  </div>

  {#if nextMatch}
    <div class="flex flex-col gap-2.5">
      {#each [nextMatch.participantHome, nextMatch.participantGuest] as team, index}
        {@const own = isSameId(team?.id, currentParticipantId)}
        <div class="flex items-center gap-3">
          <span
            aria-hidden="true"
            class="flex h-[38px] w-[38px] shrink-0 items-center justify-center rounded-full text-[13px] font-bold {own
              ? 'bg-brand-700/10 text-brand-700 dark:bg-brand-700/25 dark:text-brand-300'
              : 'bg-gray-100 text-gray-700 dark:bg-dark-500 dark:text-dark-50'}"
          >{getInitials(team?.displayName)}</span>
          <span class="heading min-w-0 flex-1 text-[15px] {own ? 'font-semibold' : 'font-medium'}">{team?.displayName || 'Unbekannt'}</span>
          {#if index === 0}
            <span class="dimmed shrink-0 text-xs">Heim</span>
          {/if}
        </div>
      {/each}
    </div>

    <div class="divider border-t"></div>

    <div class="flex flex-col gap-2">
      <span class="flex items-center gap-2.5">
        <span class="shrink-0 text-gray-600 dark:text-dark-200"><Icon name="calendar" size={18} strokeWidth={1.6} /></span>
        {formatLongDate(nextMatch.datePlanned)}
      </span>
      <span class="flex items-center gap-2.5">
        <span class="shrink-0 text-gray-600 dark:text-dark-200"><Icon name="clock" size={18} strokeWidth={1.6} /></span>
        {formatShortDate(nextMatch.datePlanned).time} Uhr
      </span>
      {#if venueName}
        <span class="flex items-center gap-2.5">
          <span class="shrink-0 text-gray-600 dark:text-dark-200"><Icon name="map-pin" size={18} strokeWidth={1.6} /></span>
          {venueName}
        </span>
      {/if}
    </div>

    <a href={reportUrl} class="btn-filled" on:click={() => trackDartEvents.matchView(nextMatch.id, nextMatch.eventId)}>
      {live ? 'Live verfolgen' : 'Zum Spielbericht'}
    </a>
  {:else}
    <p class="dimmed">Keine offenen Spiele. Die Saison ist durch.</p>
  {/if}
</section>
