<script>
  import { onMount } from 'svelte';
  import TabNav from './TabNav.svelte';
  import TeamOverview from './TeamOverview.svelte';
  import MatchesList from './MatchesList.svelte';
  import TeamInfoHeader from './TeamInfoHeader.svelte';
  import ThemeSwitch from './ThemeSwitch.svelte';

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
        <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
        <span class="ml-3 text-gray-600 dark:text-gray-300">Lade Daten...</span>
      </div>
    {/if}

  <!-- Error State -->
  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
      <div class="flex">
        <span class="text-red-400 text-xl mr-3">⚠️</span>
        <div>
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Fehler</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
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
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 min-h-[400px] transition-colors duration-200">
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

    <!-- Cooler Footer mit Avatar und Theme Switch -->
    <footer class="mt-8 pb-6">
      <div class="border-t border-gray-200 dark:border-gray-700 pt-6 transition-colors duration-200">
        <div class="flex items-center justify-center gap-6 mb-4">
          <!-- Größerer Avatar Kreis mit transparentem Bild -->
          <div class="relative">
            <!-- Äußerer Ring mit Glow-Effekt -->
            <div class="w-20 h-20 rounded-full bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 dark:from-blue-500 dark:via-blue-600 dark:to-blue-700 p-0.5 shadow-lg transition-colors duration-200">
              <!-- Innerer weißer Ring -->
              <div class="w-full h-full rounded-full bg-white dark:bg-gray-800 p-1 transition-colors duration-200">
                <!-- Avatar Container -->
                <div class="relative w-full h-full rounded-full overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-700 dark:to-gray-800 transition-colors duration-200">
                  <!-- Bild mit leichter Transparenz und coolem Hover-Effekt -->
                  <img 
                    src="/andre-emoji.png" 
                    alt="Andre Bellmann Avatar"
                    class="w-full h-full object-cover rounded-full opacity-90 hover:opacity-100 hover:scale-110 transition-all duration-300 ease-out"
                  />
                  <!-- Subtiler Overlay für mehr Style -->
                  <div class="absolute inset-0 rounded-full bg-gradient-to-t from-black/5 to-transparent dark:from-black/20"></div>
                </div>
              </div>
            </div>
            <!-- Pulsierender Ring beim Hover -->
            <div class="absolute inset-0 rounded-full bg-blue-400/30 dark:bg-blue-500/30 scale-110 opacity-0 hover:opacity-100 transition-all duration-500 ease-out animate-pulse"></div>
          </div>
          
          <!-- Footer Info linksbündig mit 3 Zeilen -->
          <div class="text-left">
            <p class="text-sm font-medium text-gray-900 dark:text-gray-100 mb-1 transition-colors duration-200">
              🎯 Fülltreffer Dashboard
            </p>
            <p class="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1 transition-colors duration-200">
              Made with ❤️ by 
              <a 
                href="https://andre-bellmann.de" 
                target="_blank" 
                rel="noopener noreferrer"
                class="font-medium text-blue-500 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors hover:underline"
              >
                Andre Bellmann
              </a>
            </p>
            <p class="text-xs text-gray-400 dark:text-gray-500 transition-colors duration-200">
              © {new Date().getFullYear()}
            </p>
          </div>
        </div>
        
        <!-- Theme Switch zentriert unter dem Avatar/Info -->
        <div class="flex justify-center">
          <ThemeSwitch />
        </div>
      </div>
    </footer>
  </div>
</div>