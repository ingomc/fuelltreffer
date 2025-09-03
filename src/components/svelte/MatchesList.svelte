<script>
  export let matches = [];
  export let currentParticipantId = null; // ID des aktuell ausgewählten Teams

  let hoveredTeamId = null; // ID des aktuell gehoverten Teams

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
    <div class="space-y-2">
      {#each sortedMatches as match}
        {@const status = getStatusBadge(match.statusCd)}
        {@const isHomeMatch = currentParticipantId && match.participantHome.id.toString() === currentParticipantId.toString()}
        <div class="border border-gray-300 dark:border-gray-600 rounded-lg p-3 bg-white dark:bg-gray-800 transition-colors duration-200">
          <!-- Kompakter Match Header -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full transition-colors duration-200">{match.round.name}</span>
              {#if isHomeMatch}
                <span class="text-xs font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full transition-colors duration-200">🏠</span>
              {/if}
            </div>
            <div class="flex items-center gap-2 rounded-full text-xs px-2 py-1 font-bold bg-{status.color}-100 dark:bg-{status.color}-900 text-{status.color}-800 dark:text-{status.color}-300 transition-colors duration-200">
              <span class="inline-flex items-center">
                {status.icon}
              </span>
              <div class="font-bold text-xs">
                {formatDate(match.datePlanned)}
              </div>
            </div>
          </div>
          
          <!-- Mobile-optimierte Player Info -->
          <div class="space-y-2">
            <!-- Home vs Guest in einer Zeile -->
            <div class="flex items-center justify-between bg-gray-50 dark:bg-gray-700 rounded-lg p-2 transition-colors duration-200">
              <div class="flex-1 text-center">
                <button 
                  type="button"
                  class="font-bold text-sm transition-colors duration-200 cursor-pointer rounded-md px-2 py-1 border-none bg-transparent w-full"
                  class:text-blue-600={match.participantHome.id.toString() === currentParticipantId?.toString()}
                  class:dark:text-blue-400={match.participantHome.id.toString() === currentParticipantId?.toString()}
                  class:bg-blue-100={match.participantHome.id.toString() === currentParticipantId?.toString()}
                  class:dark:bg-blue-900={match.participantHome.id.toString() === currentParticipantId?.toString()}
                  class:text-purple-600={hoveredTeamId && match.participantHome.id.toString() === hoveredTeamId.toString()}
                  class:dark:text-purple-400={hoveredTeamId && match.participantHome.id.toString() === hoveredTeamId.toString()}
                  class:bg-purple-100={hoveredTeamId && match.participantHome.id.toString() === hoveredTeamId.toString()}
                  class:dark:bg-purple-900={hoveredTeamId && match.participantHome.id.toString() === hoveredTeamId.toString()}
                  class:text-gray-900={!hoveredTeamId && match.participantHome.id.toString() !== currentParticipantId?.toString()}
                  class:dark:text-gray-100={!hoveredTeamId && match.participantHome.id.toString() !== currentParticipantId?.toString()}
                  class:hover:text-purple-600={match.participantHome.id.toString() !== currentParticipantId?.toString()}
                  class:dark:hover:text-purple-400={match.participantHome.id.toString() !== currentParticipantId?.toString()}
                  class:hover:bg-purple-50={match.participantHome.id.toString() !== currentParticipantId?.toString()}
                  class:dark:hover:bg-purple-900={match.participantHome.id.toString() !== currentParticipantId?.toString()}
                  on:mouseenter={() => hoveredTeamId = match.participantHome.id}
                  on:mouseleave={() => hoveredTeamId = null}
                  on:click={() => navigateToTeam(match.participantHome.id)}
                  title={match.participantHome.id.toString() !== currentParticipantId?.toString() ? 'Klicke um zu diesem Team zu wechseln' : 'Aktuell ausgewähltes Team'}
                >
                  {match.participantHome.displayName}
                </button>
                <div class="text-xs text-gray-500">#{match.participantHome.rankingPos || 'N/A'}</div>
              </div>
              <div class="px-3">
                <span class="text-sm font-bold text-gray-400 dark:text-gray-500 transition-colors duration-200">VS</span>
              </div>
              <div class="flex-1 text-center">
                <button 
                  type="button"
                  class="font-bold text-sm transition-colors duration-200 cursor-pointer rounded-md px-2 py-1 border-none bg-transparent w-full"
                  class:text-blue-600={match.participantGuest.id.toString() === currentParticipantId?.toString()}
                  class:dark:text-blue-400={match.participantGuest.id.toString() === currentParticipantId?.toString()}
                  class:bg-blue-100={match.participantGuest.id.toString() === currentParticipantId?.toString()}
                  class:dark:bg-blue-900={match.participantGuest.id.toString() === currentParticipantId?.toString()}
                  class:text-purple-600={hoveredTeamId && match.participantGuest.id.toString() === hoveredTeamId.toString()}
                  class:dark:text-purple-400={hoveredTeamId && match.participantGuest.id.toString() === hoveredTeamId.toString()}
                  class:bg-purple-100={hoveredTeamId && match.participantGuest.id.toString() === hoveredTeamId.toString()}
                  class:dark:bg-purple-900={hoveredTeamId && match.participantGuest.id.toString() === hoveredTeamId.toString()}
                  class:text-gray-900={!hoveredTeamId && match.participantGuest.id.toString() !== currentParticipantId?.toString()}
                  class:dark:text-gray-100={!hoveredTeamId && match.participantGuest.id.toString() !== currentParticipantId?.toString()}
                  class:hover:text-purple-600={match.participantGuest.id.toString() !== currentParticipantId?.toString()}
                  class:dark:hover:text-purple-400={match.participantGuest.id.toString() !== currentParticipantId?.toString()}
                  class:hover:bg-purple-50={match.participantGuest.id.toString() !== currentParticipantId?.toString()}
                  class:dark:hover:bg-purple-900={match.participantGuest.id.toString() !== currentParticipantId?.toString()}
                  on:mouseenter={() => hoveredTeamId = match.participantGuest.id}
                  on:mouseleave={() => hoveredTeamId = null}
                  on:click={() => navigateToTeam(match.participantGuest.id)}
                  title={match.participantGuest.id.toString() !== currentParticipantId?.toString() ? 'Klicke um zu diesem Team zu wechseln' : 'Aktuell ausgewähltes Team'}
                >
                  {match.participantGuest.displayName}
                </button>
                <div class="text-xs text-gray-500">#{match.participantGuest.rankingPos || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>