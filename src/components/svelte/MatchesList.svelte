<script>
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
      'FINISHED': { color: 'blue', text: 'Beendet', icon: '✅' },
      'PLANNED': { color: 'yellow', text: 'Geplant', icon: '📅' },
      'CANCELLED': { color: 'red', text: 'Abgesagt', icon: '❌' }
    };
    
    return statusMap[status] || { color: 'gray', text: status, icon: '' };
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

<div class="p-3 min-h-[600px]">
  <!-- Kompakter Header -->
  <div class="flex items-center justify-between mb-3">
    <h2 class="text-lg font-bold text-gray-900">🎯 Matches ({stats.total})</h2>
  </div>
  
  <!-- Kompakte Stats -->
  {#if matches.length > 0}
    <div class="grid grid-cols-4 gap-2 mb-4 text-center">
      <div class="bg-blue-50 rounded-lg py-2 px-1">
        <div class="text-lg font-bold text-blue-600">{stats.total}</div>
        <div class="text-xs text-gray-500">Total</div>
      </div>
      <div class="bg-green-50 rounded-lg py-2 px-1">
        <div class="text-lg font-bold text-green-600">{stats.finished}</div>
        <div class="text-xs text-gray-500">Fertig</div>
      </div>
      <div class="bg-yellow-50 rounded-lg py-2 px-1">
        <div class="text-lg font-bold text-yellow-600">{stats.planned}</div>
        <div class="text-xs text-gray-500">Geplant</div>
      </div>
      <div class="bg-purple-50 rounded-lg py-2 px-1">
        <div class="text-lg font-bold text-purple-600">{stats.active}</div>
        <div class="text-xs text-gray-500">Aktiv</div>
      </div>
    </div>
  {/if}

  <!-- Kompakte Matches List -->
  {#if matches.length === 0}
    <div class="text-center py-8">
      <span class="text-4xl">🎯</span>
      <p class="text-gray-500 mt-2 text-sm">Keine Matches gefunden</p>
    </div>
  {:else}
    <div class="space-y-2">
      {#each sortedMatches as match}
        {@const status = getStatusBadge(match.statusCd)}
        {@const isHomeMatch = currentParticipantId && match.participantHome.id.toString() === currentParticipantId.toString()}
        <div class="border border-gray-300 rounded-lg p-3 bg-white">
          <!-- Kompakter Match Header -->
          <div class="flex items-center justify-between mb-2">
            <div class="flex items-center gap-2">
              <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{match.round.name}</span>
              {#if isHomeMatch}
                <span class="text-xs font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full">🏠</span>
              {/if}
            </div>
            <div class="flex items-center gap-2 rounded-full text-xs px-2 py-1 font-bold bg-{status.color}-100 text-{status.color}-800">
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
            <div class="flex items-center justify-between bg-gray-50 rounded-lg p-2">
              <div class="flex-1 text-center">
                <div class="font-bold text-sm text-gray-900">{match.participantHome.displayName}</div>
                <div class="text-xs text-gray-500">#{match.participantHome.rankingPos || 'N/A'}</div>
              </div>
              <div class="px-3">
                <span class="text-sm font-bold text-gray-400">VS</span>
              </div>
              <div class="flex-1 text-center">
                <div class="font-bold text-sm text-gray-900">{match.participantGuest.displayName}</div>
                <div class="text-xs text-gray-500">#{match.participantGuest.rankingPos || 'N/A'}</div>
              </div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {/if}
</div>