<script>
  import { onMount } from 'svelte';
  import TabNav from './TabNav.svelte';
  import TeamOverview from './TeamOverview.svelte';
  import MatchesList from './MatchesList.svelte';
  import TeamInfoHeader from './TeamInfoHeader.svelte';

  // Props
  export let initialData = null;
  export let apiBaseUrl = '';
  export let defaultParticipantId = '308868';

  // State
  let activeTab = 'matches'; // Matches als Default
  let data = initialData;
  let loading = false;
  let error = null;
  let currentParticipantId = defaultParticipantId; // Track current participant

  // Tab configuration - Matches zuerst, dann Team-Overview
  $: teamMembersCount = data?.participant?.teamSeason?.teamMembers?.length || 0;
  $: tabs = [
    { id: 'matches', label: 'Matches', icon: '🎯' },
    { id: 'team', label: `Team (${teamMembersCount})`, icon: '👥' }
  ];

  // Load participant data
  async function loadParticipantData(participantId) {
    loading = true;
    error = null;
    currentParticipantId = participantId; // Update current participant ID

    try {
      const response = await fetch(`${apiBaseUrl}/api/participant/${participantId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      data = await response.json();
    } catch (err) {
      console.error('Error loading participant data:', err);
      error = err.message || 'Fehler beim Laden der Daten';
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // Read tab from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    
    // Set activeTab from URL if valid, otherwise keep default
    if (tabFromUrl && ['matches', 'team'].includes(tabFromUrl)) {
      activeTab = tabFromUrl;
    }
    
    // If no initial data, load default participant
    if (!data && !error) {
      loadParticipantData(defaultParticipantId);
    }
    
    // Listen for team changes from header dropdown
    const headerSelect = document.getElementById('header-team-select');
    if (headerSelect) {
      headerSelect.addEventListener('change', (event) => {
        loadParticipantData(event.target.value);
      });
    }
  });
</script>

<div class="w-full">
  <!-- Team Info Header -->
  {#if data && !loading}
    <TeamInfoHeader teamData={data} />
  {/if}

  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
    <!-- Loading State -->
    {#if loading}
      <div class="flex items-center justify-center py-12">
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span class="ml-3 text-gray-600">Lade Daten...</span>
      </div>
    {/if}

  <!-- Error State -->
  {#if error}
    <div class="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
      <div class="flex">
        <span class="text-red-400 text-xl mr-3">⚠️</span>
        <div>
          <h3 class="text-sm font-medium text-red-800">Fehler</h3>
          <p class="mt-1 text-sm text-red-700">{error}</p>
        </div>
      </div>
    </div>
  {/if}

  <!-- Content -->
  {#if data && !loading}
    <!-- Mobile Tab Navigation -->
    <div class="mb-4">
      <TabNav {tabs} bind:activeTab />
    </div>

        <!-- Tab Content -->
    <div class="bg-white rounded-lg shadow-sm border border-gray-200 min-h-[400px]">
      {#if activeTab === 'matches'}
        <MatchesList matches={data?.matches || []} {currentParticipantId} />
      {:else if activeTab === 'team'}
        <TeamOverview 
          participant={data.participant} 
          teamSeason={data.participant.teamSeason} 
          members={data.participant.teamSeason.teamMembers || []} 
        />
      {/if}
    </div>
  {/if}

    <!-- Kleiner Footer -->
    <footer class="mt-8 pb-6">
      <div class="text-center">
        <div class="border-t border-gray-200 pt-4">
          <p class="text-xs text-gray-500">
            🎯 Fülltreffer Dashboard
          </p>
          <p class="text-xs text-gray-400 mt-1 flex items-center justify-center gap-1">
            Made with ❤️ by 
            <a 
              href="https://andre-bellmann.de" 
              target="_blank" 
              rel="noopener noreferrer"
              class="inline-flex items-center gap-1 text-blue-500 hover:text-blue-700 transition-colors"
            >
              <span class="text-xs">👨‍💻</span>
              Andre Bellmann
            </a>
          </p>
        </div>
      </div>
    </footer>
  </div>
</div>