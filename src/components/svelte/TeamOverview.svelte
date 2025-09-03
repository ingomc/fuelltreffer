<script>
  import ClickTooltip from './ClickTooltip.svelte';
  
  export let participant;
  export let teamSeason;
  export let members = [];

  let showMembersTable = false;
</script>

<div class="p-3 space-y-4 min-h-[600px]">
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
                      <ClickTooltip text="Team-Kapitän 1" position="top">
                        <span class="text-xs px-1 py-0.5 rounded bg-green-100 text-green-800 cursor-help">
                          👑 1
                        </span>
                      </ClickTooltip>
                    {/if}
                    {#if member.tc2}
                      <ClickTooltip text="Team-Kapitän 2" position="top">
                        <span class="text-xs px-1 py-0.5 rounded bg-yellow-100 text-yellow-800 cursor-help">
                          👑 2
                        </span>
                      </ClickTooltip>
                    {/if}
                    {#if member.dateTo && new Date(member.dateTo) < new Date()}
                      <ClickTooltip text="Aus dem Team ausgetreten" position="top">
                        <span class="text-xs px-1 py-0.5 rounded bg-red-100 text-red-800 cursor-help">
                          Inaktiv
                        </span>
                      </ClickTooltip>
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
                  <ClickTooltip text="Team-Kapitän 1" position="top">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 cursor-help">
                      👑 1
                    </span>
                  </ClickTooltip>
                {/if}
                {#if member.tc2}
                  <ClickTooltip text="Team-Kapitän 2" position="top">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 cursor-help">
                      👑 2
                    </span>
                  </ClickTooltip>
                {/if}
                {#if member.dateTo && new Date(member.dateTo) < new Date()}
                  <ClickTooltip text="Aus dem Team ausgetreten" position="top">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 cursor-help">
                      Inaktiv
                    </span>
                  </ClickTooltip>
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