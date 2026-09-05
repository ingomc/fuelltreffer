<script>
  import { trackDartEvents } from '/src/utils/umami.js';
  
  export let matches = [];
  export let currentParticipantId = null; // ID des aktuell ausgewählten Teams

  function formatDate(dateString) {
    const date = new Date(dateString);
    const weekdays = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];
    const weekday = weekdays[date.getDay()];
    const formatted = date.toLocaleString('de-DE', {
      day: '2-digit',
      month: '2-digit', 
      year: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
    return `${weekday}. ${formatted}`;
  }

  function getStatusBadge(status) {
    const statusMap = {
      'ACTIVE': { color: 'green', text: 'Aktiv', icon: '🟢' },
      'FINISHED': { color: 'blue', text: 'Beendet', icon: '' },
      'FINISH': { color: 'blue', text: 'Beendet', icon: '' },
      'PLANNED': { color: 'yellow', text: 'Geplant', icon: '📅' },
      'OPEN': { color: 'yellow', text: 'Geplant', icon: '📅' },
      'CANCELLED': { color: 'red', text: 'Abgesagt', icon: '❌' }
    };
    
    return statusMap[status] || { color: 'gray', text: status, icon: '' };
  }

  function isFinishedMatch(match) {
    const status = match?.statusCd || match?.status;
    return ['FINISHED', 'FINISH', 'ENDED', 'COMPLETE'].includes(status);
  }

  function getFinalScore(match) {
    const scoreCandidates = [
      [match?.setsHome, match?.setsAway],
      [match?.legsHome, match?.legsAway],
      [match?.scoreHome, match?.scoreGuest],
      [match?.resultHome, match?.resultGuest],
      [match?.homeScore, match?.guestScore],
      [match?.homePoints, match?.guestPoints],
      [match?.participantHome?.score, match?.participantGuest?.score],
      [match?.participantHome?.points, match?.participantGuest?.points],
      [match?.participantHome?.result, match?.participantGuest?.result]
    ];

    const scorePair = scoreCandidates.find(([home, guest]) => home != null && guest != null);
    if (scorePair) {
      return `${scorePair[0]}:${scorePair[1]}`;
    }

    if (typeof match?.result === 'string' && match.result.includes(':')) {
      return match.result;
    }

    if (typeof match?.score === 'string' && match.score.includes(':')) {
      return match.score;
    }

    return null;
  }

  function navigateToMatchReport(eventId, matchId) {
    // Track match view
    trackDartEvents.matchView(matchId, eventId);
    
    // Include current team parameter for back navigation
    const teamParam = currentParticipantId ? `?team=${currentParticipantId}` : '';
    window.location.href = `/match/${eventId}/${matchId}/report${teamParam}`;
  }

  // Sort matches by date
  $: sortedMatches = matches.sort((a, b) => {
    const dateA = new Date(a.datePlanned).getTime();
    const dateB = new Date(b.datePlanned).getTime();
    return dateA - dateB;
  });

</script>

<div class="min-h-[600px] p-2 transition-colors duration-200 sm:p-3">
  <!-- Kompakte Matches List -->
  {#if matches.length === 0}
    <div class="text-center py-8">
      <span class="text-4xl">🎯</span>
      <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm transition-colors duration-200">Keine Matches gefunden</p>
    </div>
  {:else}
    <div class="space-y-1">
      {#each sortedMatches as match}
        {@const status = getStatusBadge(match.statusCd || match.status)}
        {@const isHomeMatch = currentParticipantId && match.participantHome.id.toString() === currentParticipantId.toString()}
        {@const finalScore = isFinishedMatch(match) ? getFinalScore(match) : null}
        <button
          type="button"
          class="border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200 cursor-pointer w-full text-left"
          on:click={() => navigateToMatchReport(match.eventId, match.id)}
        >
          <!-- Einzeilige kompakte Darstellung -->
          <div class="flex items-center gap-2 text-xs">
            <!-- Date Badge -->
            <span class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium flex-shrink-0 text-[10px]">
              {new Date(match.datePlanned).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            </span>
            
            <!-- Status Icon -->
            {#if status.icon}
              <span class="text-base flex-shrink-0" title={status.text}>{status.icon}</span>
            {/if}
            
            <!-- Home Team -->
            <span
              class="flex-1 text-left font-medium truncate px-1 py-0.5"
              class:text-blue-600={match.participantHome.id.toString() === currentParticipantId?.toString()}
              class:dark:text-blue-400={match.participantHome.id.toString() === currentParticipantId?.toString()}
              class:font-bold={match.participantHome.id.toString() === currentParticipantId?.toString()}
              class:text-gray-700={match.participantHome.id.toString() !== currentParticipantId?.toString()}
              class:dark:text-gray-300={match.participantHome.id.toString() !== currentParticipantId?.toString()}
              title={match.participantHome.displayName + (isHomeMatch ? ' (Heimspiel)' : '')}
            >
              {#if isHomeMatch}🏠{/if}
              {match.participantHome.displayName}
            </span>
            
            <!-- Score/VS -->
            <span class="font-bold px-1" class:text-green-700={!!finalScore} class:dark:text-green-400={!!finalScore} class:text-gray-400={!finalScore} class:dark:text-gray-500={!finalScore}>
              {#if isFinishedMatch(match)}
                {finalScore || 'N/A'}
              {:else}
                vs
              {/if}
            </span>
            
            <!-- Guest Team -->
            <span
              class="flex-1 text-right font-medium truncate px-1 py-0.5"
              class:text-blue-600={match.participantGuest.id.toString() === currentParticipantId?.toString()}
              class:dark:text-blue-400={match.participantGuest.id.toString() === currentParticipantId?.toString()}
              class:font-bold={match.participantGuest.id.toString() === currentParticipantId?.toString()}
              class:text-gray-700={match.participantGuest.id.toString() !== currentParticipantId?.toString()}
              class:dark:text-gray-300={match.participantGuest.id.toString() !== currentParticipantId?.toString()}
              title={match.participantGuest.displayName}
            >
              {match.participantGuest.displayName}
            </span>
          </div>
        </button>
      {/each}
    </div>
  {/if}
</div>
