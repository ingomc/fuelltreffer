<script>
  export let participant;
  export let teamSeason;
  export let members = [];

  let showStatusInfo = false;
  let showMembersTable = false;

  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  // Status badges
  function getStatusBadge(condition, trueText, falseText, trueColor = 'green', falseColor = 'red') {
    return {
      text: condition ? trueText : falseText,
      color: condition ? trueColor : falseColor
    };
  }

  $: paidStatus = getStatusBadge(participant.paid, '✓ Bezahlt', '○ Offen');
  $: presentStatus = getStatusBadge(participant.present, '✓ Anwesend', '○ Abwesend', 'green', 'yellow');
</script>

<div class="p-3 space-y-4 min-h-[600px]">
  <!-- Kompakte Spieler & Team Info Section -->
  <div>
    <div class="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
      <!-- Kompakter Spieler Header -->
      <div class="flex items-center space-x-3 mb-4">
        <div class="flex-1 min-w-0">
          <h3 class="text-lg font-bold text-gray-900 truncate">{participant.displayName}</h3>
        </div>
      </div>

      <!-- Kompakte Info-Grid -->
      <div class="grid grid-cols-2 gap-2 mb-3">
        <!-- Ranking -->
        <div class="bg-white rounded-lg p-3 text-center">
          <div class="text-xl font-bold text-blue-600">#{participant.rankingPos || 'N/A'}</div>
          <div class="text-xs text-gray-500">Ranking</div>
        </div>
        
        <!-- Position -->
        <div class="bg-white rounded-lg p-3 text-center">
          <div class="text-sm font-semibold text-gray-900">{participant.currentPosition || 'N/A'}</div>
          <div class="text-xs text-gray-500">Position</div>
        </div>
      </div>
      
      <!-- Kompakte Spielzeit & Status -->
      <div class="space-y-2">
        <div class="bg-white rounded-lg p-3">
          <div class="flex items-center justify-between">
            <div>
              <div class="text-sm font-semibold text-gray-900">{weekdays[teamSeason.weekdayMatch]}</div>
              <div class="text-xs text-gray-500">{teamSeason.throwoffTime?.slice(0, 5) || 'N/A'} Uhr</div>
            </div>
            <div class="flex gap-1">
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-{paidStatus.color}-100 text-{paidStatus.color}-800">
                {paidStatus.text.includes('✓') ? '✓' : '○'}
              </span>
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-{presentStatus.color}-100 text-{presentStatus.color}-800">
                {presentStatus.text.includes('✓') ? '✓' : '○'}
              </span>
            </div>
          </div>
        </div>

        <!-- Kompakter Spielort -->
        <div class="bg-white rounded-lg p-3">
          <div class="flex items-start">
            <span class="text-base mr-2 mt-0.5">📍</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-gray-900 text-sm">{teamSeason.playingVenue.name}</div>
              <button 
                class="text-blue-600 hover:text-blue-800 hover:underline text-xs transition-colors text-left"
                on:click={() => {
                  const address = `${teamSeason.playingVenue.locationStreet}, ${teamSeason.playingVenue.locationPostalCode} ${teamSeason.playingVenue.locationCity}`;
                  const encodedAddress = encodeURIComponent(address);
                  window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                }}
              >
                {teamSeason.playingVenue.locationStreet}, <br />
                {teamSeason.playingVenue.locationPostalCode} {teamSeason.playingVenue.locationCity}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- Kompakte Team Members Section -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-bold text-gray-900 flex items-center">
        <span class="text-xl mr-2">👥</span>
        Team ({members.length})
      </h2>
    </div>

    <!-- Kompakte Team Stats -->
    <!-- Kompakte Team Stats - bessere Kategorisierung -->
    <div class="grid grid-cols-4 gap-2 mb-3">
      <div class="bg-blue-50 rounded-lg py-2 px-1 text-center">
        <div class="text-lg font-bold text-blue-600">{members.length}</div>
        <div class="text-xs text-gray-500">Total</div>
      </div>
      <div class="bg-green-50 rounded-lg py-2 px-1 text-center">
        <div class="text-lg font-bold text-green-600">
          {members.filter(m => m.tc1 || m.tc2).length}
        </div>
        <div class="text-xs text-gray-500">Kapitäne</div>
      </div>
      <div class="bg-yellow-50 rounded-lg py-2 px-1 text-center">
        <div class="text-lg font-bold text-yellow-600">
          {members.filter(m => !m.dateTo || new Date(m.dateTo) > new Date()).length}
        </div>
        <div class="text-xs text-gray-500">Aktiv</div>
      </div>
      <div class="bg-purple-50 rounded-lg py-2 px-1 text-center">
        <div class="text-lg font-bold text-purple-600">
          {members.filter(m => m.dateTo && new Date(m.dateTo) < new Date()).length}
        </div>
        <div class="text-xs text-gray-500">Inaktiv</div>
      </div>
    </div>    <!-- Kompakte View Toggle Buttons -->
    <div class="flex justify-end mb-3">
      <div class="inline-flex rounded-lg border border-gray-200 bg-white p-0.5 shadow-sm">
        <button
          class="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
          class:bg-blue-500={!showMembersTable}
          class:text-white={!showMembersTable}
          class:shadow-sm={!showMembersTable}
          class:text-gray-700={showMembersTable}
          class:hover:bg-gray-50={showMembersTable}
          on:click={() => showMembersTable = false}
        >
          <span class="text-sm">🎴</span>
          <span class="hidden sm:inline">Karten</span>
        </button>
        <button
          class="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
          class:bg-blue-500={showMembersTable}
          class:text-white={showMembersTable}
          class:shadow-sm={showMembersTable}
          class:text-gray-700={!showMembersTable}
          class:hover:bg-gray-50={!showMembersTable}
          on:click={() => showMembersTable = true}
        >
          <span class="text-sm">📋</span>
          <span class="hidden sm:inline">Tabelle</span>
        </button>
      </div>
    </div>

    <!-- Kompakte Members List -->
    {#if members.length === 0}
      <div class="text-center py-6">
        <span class="text-4xl">👥</span>
        <p class="text-gray-500 mt-2 text-sm">Keine Mitglieder gefunden</p>
      </div>
    {:else if showMembersTable}
      <!-- Mobile-optimierte Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 text-sm">
          <thead class="bg-gray-50">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Pos</th>
              <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
              <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 uppercase">Rolle</th>
            </tr>
          </thead>
          <tbody class="bg-white divide-y divide-gray-200">
            {#each members as member}
              <tr class="hover:bg-gray-50">
                <td class="px-3 py-2">
                  <div class="flex items-center">
                    <div class="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center mr-2">
                      <span class="text-xs font-bold text-blue-600">{member.displayName.charAt(0)}</span>
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-medium text-gray-900 truncate">{member.displayName}</div>
                    </div>
                  </div>
                </td>
                <td class="px-2 py-2 text-xs text-gray-900">
                  N/A
                </td>
                <td class="px-2 py-2 text-xs text-gray-900">
                  N/A
                </td>
                <td class="px-2 py-2">
                  <div class="flex gap-1">
                    {#if member.tc1}
                      <span class="text-xs px-1 py-0.5 rounded bg-green-100 text-green-800">
                        👑 1
                      </span>
                    {/if}
                    {#if member.tc2}
                      <span class="text-xs px-1 py-0.5 rounded bg-yellow-100 text-yellow-800">
                        👑 2
                      </span>
                    {/if}
                    {#if member.dateTo && new Date(member.dateTo) < new Date()}
                      <span class="text-xs px-1 py-0.5 rounded bg-red-100 text-red-800">
                        Inaktiv
                      </span>
                    {/if}
                  </div>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <!-- Kompakte Card View -->
      <div class="space-y-2">
        {#each members as member}
          <div class="bg-white border border-gray-200 rounded-lg p-3">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span class="text-xs font-bold text-blue-600">{member.displayName.charAt(0)}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-gray-900 text-sm truncate">{member.displayName}</div>
                </div>
              </div>
              
              <div class="flex items-center gap-1 ml-2">
                {#if member.tc1}
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    👑 1
                  </span>
                {/if}
                {#if member.tc2}
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    👑 2
                  </span>
                {/if}
                {#if member.dateTo && new Date(member.dateTo) < new Date()}
                  <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    Inaktiv
                  </span>
                {/if}
              </div>
            </div>
          </div>
        {/each}
      </div>
    {/if}

                                <!-- Kompakte Symbol-Legende -->
    {#if members.length > 0}
      <div class="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
        <h4 class="text-xs font-medium text-gray-900 mb-2">Team Rollen:</h4>
        <div class="grid grid-cols-2 gap-1 text-xs text-gray-700">
          <div class="flex items-center gap-1">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">👑 1</span>
            <span>Kapitän 1</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">👑 2</span>
            <span>Kapitän 2</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">Inaktiv</span>
            <span>Ausgetreten</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>