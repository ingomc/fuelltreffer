<script>
  import MatchDetailsOverlay from './MatchDetailsOverlay.svelte';
  
  export let matches = [];
  export let currentParticipantId = null; // ID des aktuell ausgewählten Teams
  export let apiBaseUrl = '';

  let hoveredTeamId = null; // ID des aktuell gehoverten Teams
  let showMatchDetails = false;
  let selectedMatchEventId = null;
  let selectedMatchId = null;
  let selectedMatchData = null; // Store original match data

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
      'FINISHED': { color: 'blue', text: 'Beendet', icon: '✅' },
      'PLANNED': { color: 'yellow', text: 'Geplant', icon: '📅' },
      'CANCELLED': { color: 'red', text: 'Abgesagt', icon: '❌' }
    };
    
    return statusMap[status] || { color: 'gray', text: status, icon: '' };
  }

  function navigateToTeam(teamId) {
    if (teamId && teamId.toString() !== currentParticipantId?.toString()) {
      const url = new URL(window.location.href);
      url.searchParams.set('team', teamId.toString());
      window.location.href = url.toString();
    }
  }

  function showMatchDetailsOverlay(eventId, matchId, matchData) {
    selectedMatchEventId = eventId;
    selectedMatchId = matchId;
    selectedMatchData = matchData; // Store original match data
    showMatchDetails = true;
    document.body.classList.add('modal-open');
  }

  function closeMatchDetails() {
    showMatchDetails = false;
    selectedMatchEventId = null;
    selectedMatchId = null;
    selectedMatchData = null;
    document.body.classList.remove('modal-open');
  }

  // Sort matches by date
  $: sortedMatches = matches.sort((a, b) => {
    const dateA = new Date(a.datePlanned).getTime();
    const dateB = new Date(b.datePlanned).getTime();
    return dateA - dateB;
  });

  // Calculate statistics
  $: stats = {
    total: matches.length,
    finished: matches.filter(m => m.statusCd === 'FINISHED').length,
    planned: matches.filter(m => m.statusCd === 'PLANNED').length,
    active: matches.filter(m => m.active).length
  };
</script>

<div class="p-3 min-h-[600px] transition-colors duration-200">
  <!-- Kompakter Header -->
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 transition-colors duration-200">🎯 Matches ({stats.total})</h2>
  </div>
  
  <!-- Kompakte Stats -->
  {#if matches.length > 0}
        <div class="grid grid-cols-4 gap-2 mb-4 text-center">
      <div class="bg-blue-50 dark:bg-blue-900 rounded-lg py-2 px-1 transition-colors duration-200">
        <div class="text-lg font-bold text-blue-600 dark:text-blue-400">{stats.total}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Total</div>
      </div>
      <div class="bg-green-50 dark:bg-green-900 rounded-lg py-2 px-1 transition-colors duration-200">
        <div class="text-lg font-bold text-green-600 dark:text-green-400">{stats.finished}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Fertig</div>
      </div>
      <div class="bg-yellow-50 dark:bg-yellow-900 rounded-lg py-2 px-1 transition-colors duration-200">
        <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{stats.planned}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Geplant</div>
      </div>
      <div class="bg-purple-50 dark:bg-purple-900 rounded-lg py-2 px-1 transition-colors duration-200">
        <div class="text-lg font-bold text-purple-600 dark:text-purple-400">{stats.active}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Aktiv</div>
      </div>
    </div>
  {/if}

  <!-- Kompakte Matches List -->
  {#if matches.length === 0}
    <div class="text-center py-8">
      <span class="text-4xl">🎯</span>
      <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm transition-colors duration-200">Keine Matches gefunden</p>
    </div>
  {:else}
    <div class="space-y-1">
      {#each sortedMatches as match}
        {@const status = getStatusBadge(match.statusCd)}
        {@const isHomeMatch = currentParticipantId && match.participantHome.id.toString() === currentParticipantId.toString()}
        <button
          type="button"
          class="border border-gray-200 dark:border-gray-700 rounded-md p-2 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-750 transition-all duration-200 cursor-pointer w-full text-left"
          on:click={() => showMatchDetailsOverlay(match.eventId, match.id, match)}
        >
          <!-- Einzeilige kompakte Darstellung -->
          <div class="flex items-center gap-2 text-xs">
            <!-- Date Badge -->
            <span class="bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-2 py-1 rounded font-medium flex-shrink-0 text-[10px]">
              {new Date(match.datePlanned).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit' })}
            </span>
            
            <!-- Status Icon -->
            <span class="text-base flex-shrink-0">{status.icon}</span>
            
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
            <span class="font-bold text-gray-400 dark:text-gray-500 px-1">-</span>
            
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

<!-- Match Details Overlay -->
<MatchDetailsOverlay 
  bind:isVisible={showMatchDetails}
  eventId={selectedMatchEventId}
  matchId={selectedMatchId}
  originalMatchData={selectedMatchData}
  {apiBaseUrl}
  on:close={closeMatchDetails}
/>