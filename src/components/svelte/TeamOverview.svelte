<script>
  import { onMount } from 'svelte';
  import ClickTooltip from './ClickTooltip.svelte';
  
  export let participant;
  export let teamSeason;
  export let members = [];

  let showMembersTable = false;
  
  function updateView(isTable) {
    showMembersTable = isTable;
    updateURL(isTable);
  }
  
  function updateURL(isTable) {
    const url = new URL(window.location.href);
    if (isTable) {
      url.searchParams.set('view', 'table');
    } else {
      // Remove view parameter for default (cards) view to keep URL clean
      url.searchParams.delete('view');
    }
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  }
  
  onMount(() => {
    // Read view from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    
    // Set showMembersTable from URL if valid
    if (viewFromUrl === 'table') {
      showMembersTable = true;
    }
    // Default is cards (showMembersTable = false), no URL parameter needed
  });
</script>

<div class="p-3 space-y-4 min-h-[600px] transition-colors duration-200">
  <!-- Kompakte Team Members Section -->
  <div>
    <div class="flex items-center justify-between mb-3">
      <h2 class="text-lg font-bold text-gray-900 dark:text-gray-100 flex items-center transition-colors duration-200">
        <span class="text-xl mr-2">👥</span>
        Team ({members.length})
      </h2>
    </div>

    <!-- Kompakte Team Stats -->
    <!-- Kompakte Team Stats - bessere Kategorisierung -->
    <div class="grid grid-cols-4 gap-2 mb-3">
      <div class="bg-blue-50 dark:bg-blue-900 rounded-lg py-2 px-1 text-center transition-colors duration-200">
        <div class="text-lg font-bold text-blue-600 dark:text-blue-400">{members.length}</div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Total</div>
      </div>
      <div class="bg-green-50 dark:bg-green-900 rounded-lg py-2 px-1 text-center transition-colors duration-200">
        <div class="text-lg font-bold text-green-600 dark:text-green-400">
          {members.filter(m => m.tc1 || m.tc2).length}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Kapitäne</div>
      </div>
      <div class="bg-yellow-50 dark:bg-yellow-900 rounded-lg py-2 px-1 text-center transition-colors duration-200">
        <div class="text-lg font-bold text-yellow-600 dark:text-yellow-400">
          {members.filter(m => !m.dateTo || new Date(m.dateTo) > new Date()).length}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Aktiv</div>
      </div>
      <div class="bg-purple-50 dark:bg-purple-900 rounded-lg py-2 px-1 text-center transition-colors duration-200">
        <div class="text-lg font-bold text-purple-600 dark:text-purple-400">
          {members.filter(m => m.dateTo && new Date(m.dateTo) < new Date()).length}
        </div>
        <div class="text-xs text-gray-500 dark:text-gray-400">Inaktiv</div>
      </div>
    </div>    <!-- Kompakte View Toggle Buttons -->
    <div class="flex justify-end mb-3">
      <div class="inline-flex rounded-lg border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 p-0.5 shadow-sm transition-colors duration-200">
        <button
          class="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
          class:bg-blue-500={!showMembersTable}
          class:text-white={!showMembersTable}
          class:shadow-sm={!showMembersTable}
          class:text-gray-700={showMembersTable}
          class:dark:text-gray-300={showMembersTable}
          class:hover:bg-gray-50={showMembersTable}
          class:dark:hover:bg-gray-700={showMembersTable}
          on:click={() => updateView(false)}
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
          class:dark:text-gray-300={!showMembersTable}
          class:hover:bg-gray-50={!showMembersTable}
          class:dark:hover:bg-gray-700={!showMembersTable}
          on:click={() => updateView(true)}
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
        <p class="text-gray-500 dark:text-gray-400 mt-2 text-sm transition-colors duration-200">Keine Mitglieder gefunden</p>
      </div>
    {:else if showMembersTable}
      <!-- Mobile-optimierte Table -->
      <div class="overflow-x-auto">
        <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm transition-colors duration-200">
          <thead class="bg-gray-50 dark:bg-gray-800 transition-colors duration-200">
            <tr>
              <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase transition-colors duration-200">Name</th>
              <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase transition-colors duration-200">Pos</th>
              <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase transition-colors duration-200">#</th>
              <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase transition-colors duration-200">Rolle</th>
            </tr>
          </thead>
          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700 transition-colors duration-200">
            {#each members as member}
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200">
                <td class="px-3 py-2">
                  <div class="flex items-center">
                    <div class="w-6 h-6 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center mr-2 transition-colors duration-200">
                      <span class="text-xs font-bold text-blue-600 dark:text-blue-400">{member.displayName.charAt(0)}</span>
                    </div>
                    <div class="min-w-0">
                      <div class="text-xs font-medium text-gray-900 dark:text-gray-100 truncate transition-colors duration-200">{member.displayName}</div>
                    </div>
                  </div>
                </td>
                <td class="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 transition-colors duration-200">
                  N/A
                </td>
                <td class="px-2 py-2 text-xs text-gray-900 dark:text-gray-100 transition-colors duration-200">
                  N/A
                </td>
                <td class="px-2 py-2">
                  <div class="flex gap-1">
                    {#if member.tc1}
                      <ClickTooltip text="Team-Kapitän 1" position="top">
                        <span class="text-xs px-1 py-0.5 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 cursor-help transition-colors duration-200">
                          👑 1
                        </span>
                      </ClickTooltip>
                    {/if}
                    {#if member.tc2}
                      <ClickTooltip text="Team-Kapitän 2" position="top">
                        <span class="text-xs px-1 py-0.5 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 cursor-help transition-colors duration-200">
                          👑 2
                        </span>
                      </ClickTooltip>
                    {/if}
                    {#if member.dateTo && new Date(member.dateTo) < new Date()}
                      <ClickTooltip text="Aus dem Team ausgetreten" position="top">
                        <span class="text-xs px-1 py-0.5 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 cursor-help transition-colors duration-200">
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
          <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 transition-colors duration-200">
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 flex-1 min-w-0">
                <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center transition-colors duration-200">
                  <span class="text-xs font-bold text-blue-600 dark:text-blue-400">{member.displayName.charAt(0)}</span>
                </div>
                <div class="min-w-0 flex-1">
                  <div class="font-medium text-gray-900 dark:text-gray-100 text-sm truncate transition-colors duration-200">{member.displayName}</div>
                </div>
              </div>
              
              <div class="flex items-center gap-1 ml-2">
                {#if member.tc1}
                  <ClickTooltip text="Team-Kapitän 1" position="top">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 cursor-help transition-colors duration-200">
                      👑 1
                    </span>
                  </ClickTooltip>
                {/if}
                {#if member.tc2}
                  <ClickTooltip text="Team-Kapitän 2" position="top">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 cursor-help transition-colors duration-200">
                      👑 2
                    </span>
                  </ClickTooltip>
                {/if}
                {#if member.dateTo && new Date(member.dateTo) < new Date()}
                  <ClickTooltip text="Aus dem Team ausgetreten" position="top">
                    <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 cursor-help transition-colors duration-200">
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
      <div class="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors duration-200">
        <h4 class="text-xs font-medium text-gray-900 dark:text-gray-100 mb-2 transition-colors duration-200">Team Rollen:</h4>
        <div class="grid grid-cols-2 gap-1 text-xs text-gray-700 dark:text-gray-300 transition-colors duration-200">
          <div class="flex items-center gap-1">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 transition-colors duration-200">👑 1</span>
            <span>Kapitän 1</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300 transition-colors duration-200">👑 2</span>
            <span>Kapitän 2</span>
          </div>
          <div class="flex items-center gap-1">
            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300 transition-colors duration-200">Inaktiv</span>
            <span>Ausgetreten</span>
          </div>
        </div>
      </div>
    {/if}
  </div>
</div>