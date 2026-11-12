<script>
  import Icon from './Icon.svelte';
  import { trackDartEvents } from '/src/utils/umami.js';
  import {
    formatShortDate, getMatchOutcome, getScorePair, getShortTeamName, isCancelledMatch, isFinishedMatch,
    isLiveMatch, isSameId, sortByDate, OUTCOME_LABELS
  } from '../../lib/match-utils';

  export let matches = [];
  export let currentParticipantId = null; // ID des aktuell ausgewählten Teams
  // Limits for the overview; without them every match is listed
  export let upcomingLimit = null;
  export let resultsLimit = null;
  export let onShowAll = null;

  const outcomeBadges = { win: 'badge-win', loss: 'badge-loss', draw: 'badge-gray' };

  // Upcoming matches chronologically, results with the most recent first
  $: upcomingAll = sortByDate(matches.filter(match => !isFinishedMatch(match)), 'asc');
  $: resultsAll = sortByDate(matches.filter(isFinishedMatch), 'desc');
  $: sections = [
    { id: 'upcoming', title: 'Anstehend', items: upcomingLimit ? upcomingAll.slice(0, upcomingLimit) : upcomingAll },
    { id: 'results', title: 'Ergebnisse', items: resultsLimit ? resultsAll.slice(0, resultsLimit) : resultsAll }
  ].filter(section => section.items.length > 0);

  function reportHref(match) {
    // Include current team parameter for back navigation
    const teamParam = currentParticipantId ? `?team=${currentParticipantId}` : '';
    return `/match/${match.eventId}/${match.id}/report${teamParam}`;
  }

  // The own team is always shortened; opponents keep their full name where there is room.
  function pairing(match, compact) {
    const name = (team) => (compact || isSameId(team?.id, currentParticipantId))
      ? getShortTeamName(team)
      : team?.displayName || '';
    return `${name(match.participantHome)} – ${name(match.participantGuest)}`;
  }
</script>

<section class="paper flex flex-col overflow-hidden">
  <div class="paper-head">
    <h2 class="paper-title">Spiele</h2>
    {#if onShowAll && matches.length > 0}
      <button type="button" class="link rounded-md text-sm" on:click={onShowAll}>Alle {matches.length} Spiele</button>
    {:else}
      <span class="dimmed text-xs">{upcomingAll.length} offen · {resultsAll.length} gespielt</span>
    {/if}
  </div>

  {#if matches.length === 0}
    <div class="divider flex flex-col items-center border-t px-6 py-12 text-center">
      <span class="text-gray-600 dark:text-dark-200"><Icon name="target" size={28} strokeWidth={1.5} /></span>
      <p class="heading mt-3 font-semibold">Keine Matches gefunden</p>
      <p class="dimmed mt-1">Sobald der Spielplan steht, erscheinen die Spiele hier.</p>
    </div>
  {/if}

  {#each sections as section (section.id)}
    <h3 class="section-row">{section.title}</h3>
    {#each section.items as match (match.id)}
      {@const date = formatShortDate(match.datePlanned)}
      {@const finished = isFinishedMatch(match)}
      {@const score = finished ? getScorePair(match) : null}
      {@const outcome = getMatchOutcome(match, currentParticipantId)}
      {@const cancelled = isCancelledMatch(match)}
      {@const side = isSameId(match.participantHome?.id, currentParticipantId) ? 'Heim' : 'Auswärts'}
      <a
        href={reportHref(match)}
        class="divider grid min-h-[48px] grid-cols-[48px_minmax(0,1fr)_auto_30px] items-center gap-3 border-t px-4 py-2 transition-colors hover:bg-gray-50 sm:grid-cols-[92px_minmax(0,1fr)_96px_64px_30px] sm:px-5 dark:hover:bg-dark-500/40"
        on:click={() => trackDartEvents.matchView(match.id, match.eventId)}
      >
        <span class="dimmed tabular-nums"><span class="hidden sm:inline">{date.weekday},&nbsp;</span>{date.date}</span>
        <span class="min-w-0">
          <span class="heading block truncate font-medium {cancelled ? 'line-through opacity-60' : ''}">
            <span class="sm:hidden">{pairing(match, true)}</span>
            <span class="hidden sm:inline">{pairing(match, false)}</span>
          </span>
          <span class="dimmed block text-xs sm:hidden">{side}</span>
        </span>
        <span class="hidden sm:block"><span class="badge-gray">{side}</span></span>
        <span class="heading text-right tabular-nums">
          {#if isLiveMatch(match)}
            <span class="badge-brand"><span class="h-1.5 w-1.5 animate-pulse rounded-full bg-current"></span>Live</span>
          {:else if cancelled}
            <span class="dimmed text-xs">Abgesagt</span>
          {:else if finished}
            <span class="font-bold">{score ? `${score[0]}:${score[1]}` : '–'}</span>
          {:else}
            <span class="font-semibold">{date.time}</span>
          {/if}
        </span>
        <span>
          {#if outcome}
            <span class="{outcomeBadges[outcome]} w-[30px] px-0" title={OUTCOME_LABELS[outcome].long}>{OUTCOME_LABELS[outcome].short}</span>
          {/if}
        </span>
      </a>
    {/each}
  {/each}
</section>
