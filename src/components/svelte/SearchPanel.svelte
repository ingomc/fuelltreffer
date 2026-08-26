<script>
  import { createEventDispatcher } from 'svelte';
  import { trackDartEvents, trackEvent } from '/src/utils/umami.js';
  import { CURRENT_LEAGUE } from '../../config/league';
  
  export let defaultParticipantId = CURRENT_LEAGUE.defaultParticipantId;
  
  const dispatch = createEventDispatcher();
  
  let selectedTeam = defaultParticipantId;
  let isLoading = false;

  const knownTeams = CURRENT_LEAGUE.teams;

  function handleTeamSelect() {
    if (selectedTeam) {
      isLoading = true;
      
      // Track team selection
      const selectedTeamData = knownTeams.find(t => t.id === selectedTeam);
      trackEvent('team_selected', {
        team_id: selectedTeam,
        team_name: selectedTeamData?.name || 'Unknown',
        page: window.location.pathname
      });
      
      dispatch('search', { participantId: selectedTeam });
      
      // Reset loading state after a delay (parent will handle the actual loading)
      setTimeout(() => {
        isLoading = false;
      }, 500);
    }
  }
</script>

<div class="bg-white border border-gray-200 rounded-lg p-4">
  <div class="flex sm:flex-row gap-3">
    <div class="flex-1">
      <select 
        id="team-select"
        bind:value={selectedTeam}
        on:change={handleTeamSelect}
        class="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
        disabled={isLoading}
      >
        {#each knownTeams as team}
          <option value={team.id}>
            {team.name}
          </option>
        {/each}
      </select>
    </div>
    
    <div class="flex items-center">
      {#if isLoading}
        <div class="flex items-center text-blue-600">
          <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-2"></div>
          <span class="text-sm">Lädt...</span>
        </div>
      {:else}
        <span class="text-green-600 text-sm">✓ Bereit</span>
      {/if}
    </div>
  </div>
  
  <!-- Info -->
  <div class="mt-3 p-3 bg-blue-50 rounded text-xs text-blue-700">
    <p><strong>💡 Tipp:</strong> Wähle ein Team aus dem Dropdown - die Daten werden automatisch geladen!</p>
  </div>
</div>
