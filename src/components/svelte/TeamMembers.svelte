<script>
  export let members = [];

  let showStatusInfo = false;
</script>

<div class="p-6">
  <!-- Header -->
  <div class="flex items-center justify-between mb-6">
    <h2 class="text-xl font-bold text-gray-900">Team Mitglieder ({members.length})</h2>
    <button 
      class="text-sm text-blue-600 hover:text-blue-800"
      on:click={() => showStatusInfo = !showStatusInfo}
    >
      {showStatusInfo ? 'Info ausblenden' : 'Status-Info'}
    </button>
  </div>

  <!-- Status Info -->
  {#if showStatusInfo}
    <div class="mb-6 p-4 bg-blue-50 rounded-lg">
      <h3 class="font-medium text-blue-900 mb-2">Status-Erklärung:</h3>
      <div class="space-y-1 text-sm text-blue-800">
        <div><strong>✓ Bezahlt / ○ Offen:</strong> Mitgliedsbeitrag für die Saison</div>
        <div><strong>✓ Anwesend / ○ Abwesend:</strong> Aktuelle Anwesenheit</div>
        <div><strong>⊘ Zurückgetreten:</strong> Spieler hat sich zurückgezogen</div>
        <div><strong>⊘ Abgemeldet:</strong> Spieler wurde abgemeldet</div>
      </div>
    </div>
  {/if}

  <!-- Members List -->
  {#if members.length === 0}
    <div class="text-center py-12">
      <span class="text-6xl">👥</span>
      <p class="text-gray-500 mt-4">Keine Mitglieder gefunden</p>
    </div>
  {:else}
    <!-- Mobile Cards -->
    <div class="block md:hidden space-y-4">
      {#each members as member}
        <div class="bg-gray-50 rounded-lg p-4">
          <div class="flex items-center space-x-3 mb-3">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <span class="text-sm font-bold text-blue-600">{member.displayName.charAt(0)}</span>
            </div>
            <div>
              <div class="font-medium text-gray-900">{member.displayName}</div>
              <div class="text-sm text-gray-500">ID: {member.id}</div>
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-3 mb-3 text-sm">
            <div>
              <span class="font-medium text-gray-700">Position:</span>
              <div class="text-gray-900">{member.currentPosition || 'N/A'}</div>
            </div>
            <div>
              <span class="font-medium text-gray-700">Ranking:</span>
              <div class="text-gray-900">{member.rankingPos ? `#${member.rankingPos}` : 'N/A'}</div>
            </div>
          </div>
          
          <div class="flex flex-wrap gap-1">
            {#if member.paid}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Bezahlt</span>
            {:else}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">○ Offen</span>
            {/if}
            
            {#if member.present}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓ Anwesend</span>
            {:else}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">○ Abwesend</span>
            {/if}
            
            {#if member.retired}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">⊘ Zurück</span>
            {/if}
            
            {#if member.deregistered}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">⊘ Abgemeldet</span>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Desktop Table -->
    <div class="hidden md:block overflow-x-auto">
      <table class="min-w-full divide-y divide-gray-200">
        <thead class="bg-gray-50">
          <tr>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Position</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ranking</th>
            <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
          </tr>
        </thead>
        <tbody class="bg-white divide-y divide-gray-200">
          {#each members as member}
            <tr class="hover:bg-gray-50">
              <td class="px-6 py-4">
                <div class="flex items-center">
                  <div class="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span class="text-xs font-bold text-blue-600">{member.displayName.charAt(0)}</span>
                  </div>
                  <div>
                    <div class="text-sm font-medium text-gray-900">{member.displayName}</div>
                    <div class="text-sm text-gray-500">ID: {member.id}</div>
                  </div>
                </div>
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {member.currentPosition || 'N/A'}
              </td>
              <td class="px-6 py-4 text-sm text-gray-900">
                {member.rankingPos ? `#${member.rankingPos}` : 'N/A'}
              </td>
              <td class="px-6 py-4">
                <div class="flex flex-wrap gap-1">
                  {#if member.paid}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">✓</span>
                  {:else}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">○</span>
                  {/if}
                  
                  {#if member.present}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">👤</span>
                  {:else}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">👤</span>
                  {/if}
                  
                  {#if member.retired}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">⊘</span>
                  {/if}
                  
                  {#if member.deregistered}
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">✗</span>
                  {/if}
                </div>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</div>