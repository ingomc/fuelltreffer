<script>
  import CalendarSubscribe from './CalendarSubscribe.svelte';
  import Icon from './Icon.svelte';
  import { trackDartEvents } from '/src/utils/umami.js';
  import {
    getDateParts, getMatchOutcome, getScorePair, getShortTeamName, isCancelledMatch, isFinishedMatch, isLiveMatch, isSameId, sortByDate,
    OUTCOME_LABELS
  } from '../../lib/match-utils';

  export let matches = [];
  export let currentParticipantId = null; // ID des aktuell ausgewählten Teams

  const outcomeStyles = {
    win: 'bg-win-50 text-win-700 ring-win-600/20 dark:bg-win-500/10 dark:text-win-300 dark:ring-win-400/25',
    loss: 'bg-loss-50 text-loss-700 ring-loss-600/20 dark:bg-loss-500/10 dark:text-loss-300 dark:ring-loss-400/25',
    draw: 'bg-draw-50 text-draw-700 ring-draw-600/20 dark:bg-draw-500/10 dark:text-draw-300 dark:ring-draw-400/25'
  };

  function navigateToMatchReport(eventId, matchId) {
    // Track match view
    trackDartEvents.matchView(matchId, eventId);

    // Include current team parameter for back navigation
    const teamParam = currentParticipantId ? `?team=${currentParticipantId}` : '';
    window.location.href = `/match/${eventId}/${matchId}/report${teamParam}`;
  }

  // Upcoming matches chronologically, results with the most recent first
  $: upcomingMatches = sortByDate(matches.filter(match => !isFinishedMatch(match)), 'asc');
  $: playedMatches = sortByDate(matches.filter(isFinishedMatch), 'desc');
  $: sections = [
    { id: 'upcoming', title: 'Anstehend', icon: 'calendar', items: upcomingMatches },
    { id: 'played', title: 'Ergebnisse', icon: 'check', items: playedMatches }
  ].filter(section => section.items.length > 0);
</script>

<div class="space-y-5">
  <div class="card flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
    <div>
      <p class="text-sm font-semibold text-zinc-900 dark:text-white">Spielplan</p>
      <p class="text-xs text-zinc-500 dark:text-zinc-400">{matches.length} Spiele · {playedMatches.length} gespielt · {upcomingMatches.length} offen</p>
    </div>
    <CalendarSubscribe participantId={currentParticipantId} />
  </div>

  {#if matches.length === 0}
    <div class="card flex flex-col items-center px-6 py-14 text-center">
      <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-white/5">
        <Icon name="target" size={22} />
      </span>
      <p class="mt-3 text-sm font-medium text-zinc-900 dark:text-white">Keine Matches gefunden</p>
      <p class="mt-1 text-sm text-zinc-500 dark:text-zinc-400">Sobald der Spielplan steht, erscheinen die Spiele hier.</p>
    </div>
  {/if}

  {#each sections as section (section.id)}
    <section aria-labelledby="matches-{section.id}">
      <div class="mb-2 flex items-center gap-2 px-1">
        <Icon name={section.icon} size={14} class="text-zinc-400" />
        <h2 id="matches-{section.id}" class="eyebrow">{section.title}</h2>
        <span class="text-xs tabular-nums text-zinc-400">{section.items.length}</span>
      </div>

      <ul class="card divide-y divide-zinc-100 overflow-hidden dark:divide-white/[0.05]">
        {#each section.items as match (match.id)}
          {@const date = getDateParts(match.datePlanned)}
          {@const outcome = getMatchOutcome(match, currentParticipantId)}
          {@const score = isFinishedMatch(match) ? getScorePair(match) : null}
          {@const live = isLiveMatch(match)}
          {@const cancelled = isCancelledMatch(match)}
          {@const isHomeMatch = isSameId(match.participantHome?.id, currentParticipantId)}
          <li>
            <button
              type="button"
              class="group flex w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-zinc-50 sm:gap-4 sm:px-4 dark:hover:bg-white/[0.03]"
              on:click={() => navigateToMatchReport(match.eventId, match.id)}
            >
              <!-- Date tile -->
              <div class="flex w-12 shrink-0 flex-col items-center rounded-xl border py-1.5 leading-none {live
                ? 'border-loss-300 bg-loss-50 dark:border-loss-500/40 dark:bg-loss-500/10'
                : 'border-zinc-200 bg-zinc-50 dark:border-white/10 dark:bg-white/[0.04]'}">
                <span class="text-[10px] font-semibold uppercase text-zinc-500 dark:text-zinc-400">{date.weekday}</span>
                <span class="num mt-0.5 text-lg font-bold text-zinc-900 dark:text-white">{date.day}</span>
                <span class="text-[10px] font-medium uppercase text-zinc-400">{date.month}</span>
              </div>

              <!-- Teams -->
              <div class="min-w-0 flex-1 space-y-1 {cancelled ? 'opacity-50' : ''}">
                {#each [[match.participantHome, score?.[0], score && score[0] > score[1]], [match.participantGuest, score?.[1], score && score[1] > score[0]]] as [team, teamScore, won], index}
                  {@const own = isSameId(team?.id, currentParticipantId)}
                  <div class="flex items-center gap-2">
                    <span class="h-1.5 w-1.5 shrink-0 rounded-full {own ? 'bg-brand-500' : 'bg-transparent'}"></span>
                    <span
                      class="min-w-0 flex-1 truncate text-sm {own ? 'font-semibold text-zinc-900 dark:text-white' : 'text-zinc-600 dark:text-zinc-300'} {cancelled ? 'line-through' : ''}"
                      title={team?.displayName + (index === 0 && isHomeMatch ? ' (Heimspiel)' : '')}
                    >
                      <span class="sm:hidden">{getShortTeamName(team)}</span>
                      <span class="hidden sm:inline">{team?.displayName}</span>
                    </span>
                    {#if score}
                      <span class="num w-6 text-right text-base {won ? 'font-bold text-zinc-900 dark:text-white' : 'font-medium text-zinc-400'}">{teamScore}</span>
                    {/if}
                  </div>
                {/each}
              </div>

              <!-- Status -->
              <div class="flex shrink-0 flex-col items-end gap-1 text-right sm:w-[76px]">
                {#if live}
                  <span class="inline-flex items-center gap-1.5 rounded-md bg-loss-500 px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide text-white">
                    <span class="h-1.5 w-1.5 animate-pulse rounded-full bg-white"></span> Live
                  </span>
                {:else if cancelled}
                  <span class="text-xs font-medium text-zinc-500">Abgesagt</span>
                {:else if outcome}
                  <span class="inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ring-1 ring-inset {outcomeStyles[outcome]}" title={OUTCOME_LABELS[outcome].long}>
                    {OUTCOME_LABELS[outcome].short}
                  </span>
                {:else if isFinishedMatch(match)}
                  <span class="text-xs font-medium text-zinc-500">Beendet</span>
                {:else}
                  <span class="num text-sm font-semibold text-zinc-900 dark:text-white">{date.time}</span>
                {/if}
                {#if !isFinishedMatch(match) && !cancelled}
                  <span class="inline-flex items-center gap-1 text-[11px] text-zinc-500 dark:text-zinc-400">
                    <Icon name={isHomeMatch ? 'home' : 'arrow-right'} size={11} />
                    {isHomeMatch ? 'Heim' : 'Auswärts'}
                  </span>
                {/if}
              </div>

              <Icon name="chevron-right" size={16} class="hidden text-zinc-300 transition-transform group-hover:translate-x-0.5 group-hover:text-zinc-500 sm:block dark:text-zinc-600" />
            </button>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>
