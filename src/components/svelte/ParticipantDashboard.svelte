<script>
  import { onMount } from 'svelte';
  import TabNav from './TabNav.svelte';
  import TeamOverview from './TeamOverview.svelte';
  import MatchesList from './MatchesList.svelte';
  import TeamInfoHeader from './TeamInfoHeader.svelte';
  import LeagueTable from './LeagueTable.svelte';
  import NextMatchCard from './NextMatchCard.svelte';
  import MiniTable from './MiniTable.svelte';
  import Icon from './Icon.svelte';
  import { loadLeagueTableEntries } from '../../lib/league-table';
  import { trackDartEvents, trackEvent } from '/src/utils/umami.js';
  import { CURRENT_LEAGUE } from '../../config/league';

  // Props
  export let initialData = null;
  export let apiBaseUrl = '';
  export let defaultParticipantId = CURRENT_LEAGUE.defaultParticipantId;

  // State
  let activeTab = 'matches'; // Matches als Default
  let data = initialData;
  let loading = false;
  let error = null;
  let currentParticipantId = defaultParticipantId; // Track current participant
  let tableEntries = null;
  let tableFailed = false;

  // Tab configuration - Matches zuerst, dann Team-Overview, dann Liga-Tabelle
  $: teamMembersCount = data?.participant?.teamSeason?.teamMembers?.length || 0;
  $: matches = data?.matches || [];
  $: tabs = [
    { id: 'matches', label: 'Spiele', icon: 'target', count: matches.length },
    { id: 'team', label: 'Team', icon: 'users', count: teamMembersCount },
    { id: 'table', label: 'Tabelle', icon: 'trophy' }
  ];
  $: tableLoading = !tableEntries && !tableFailed;
  $: tableEntry = tableEntries?.find(entry => entry.participantId === String(currentParticipantId)) || null;

  function showTab(tabId) {
    activeTab = tabId;
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    window.history.replaceState({}, '', url.toString());
    document.getElementById('dashboard-tabs')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Load participant data
  async function loadParticipantData(participantId) {
    loading = true;
    error = null;
    currentParticipantId = participantId; // Update current participant ID

    // Track participant view
    trackDartEvents.participantView(participantId);

    try {
      const response = await fetch(`${apiBaseUrl}/api/participant/${participantId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      data = await response.json();
      
      // Track successful data load
      trackEvent('participant_data_loaded', {
        participant_id: participantId,
        team_name: data?.participant?.teamSeason?.team?.displayName,
        team_members_count: teamMembersCount
      });
      
    } catch (err) {
      console.error('Error loading participant data:', err);
      error = err.message || 'Fehler beim Laden der Daten';
      
      // Track error
      trackEvent('participant_data_error', {
        participant_id: participantId,
        error_type: err.message || 'unknown'
      });
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    // Read tab from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    
    // Set activeTab from URL if valid, otherwise keep default
    if (tabFromUrl && ['matches', 'team', 'table'].includes(tabFromUrl)) {
      activeTab = tabFromUrl;
    }
    
    loadLeagueTableEntries()
      .then(entries => { tableEntries = entries; })
      .catch(() => { tableFailed = true; });

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
    <TeamInfoHeader
      teamData={data}
      participantId={currentParticipantId}
      {tableEntry}
      tableSize={tableEntries?.length || 0}
      {tableLoading}
    />
  {/if}

  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
    <!-- Loading State -->
    {#if loading}
      <div class="space-y-6 pt-10" aria-busy="true" aria-label="Lade Daten">
        <div class="flex items-center gap-4">
          <div class="skeleton h-20 w-20 rounded-2xl"></div>
          <div class="flex-1 space-y-3">
            <div class="skeleton h-4 w-40"></div>
            <div class="skeleton h-8 w-72 max-w-full"></div>
          </div>
        </div>
        <div class="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {#each Array(4) as _}<div class="skeleton h-28 rounded-2xl"></div>{/each}
        </div>
        <div class="skeleton h-96 rounded-2xl"></div>
      </div>
    {/if}

    <!-- Error State -->
    {#if error}
      <div class="mt-8 flex gap-3 rounded-2xl border border-loss-200 bg-loss-50 p-4 dark:border-loss-500/30 dark:bg-loss-500/10" role="alert">
        <Icon name="alert" size={20} class="mt-0.5 text-loss-500" />
        <div>
          <h3 class="text-sm font-semibold text-loss-800 dark:text-loss-200">Daten konnten nicht geladen werden</h3>
          <p class="mt-1 text-sm text-loss-700 dark:text-loss-300">{error}</p>
        </div>
      </div>
    {/if}

    <!-- Content -->
    {#if data && !loading}
      <div class="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <aside class="space-y-4 lg:sticky lg:top-24 lg:order-last">
          <NextMatchCard {matches} {currentParticipantId} />
          <div class="hidden lg:block">
            <MiniTable
              entries={tableEntries || []}
              {currentParticipantId}
              loading={tableLoading}
              onShowAll={() => showTab('table')}
            />
          </div>
        </aside>

        <section class="min-w-0 space-y-4">
          <div id="dashboard-tabs" class="scroll-mt-24">
            <TabNav {tabs} bind:activeTab />
          </div>

          <div class="min-h-[400px]" role="tabpanel">
            {#if activeTab === 'matches'}
              <MatchesList {matches} {currentParticipantId} />
            {:else if activeTab === 'team'}
              <TeamOverview 
                participant={data.participant} 
                teamSeason={data.participant.teamSeason} 
                members={data.participant.teamSeason.teamMembers || []} 
              />
            {:else if activeTab === 'table'}
              <LeagueTable 
                {currentParticipantId}
                {apiBaseUrl}
              />
            {/if}
          </div>
        </section>
      </div>
    {/if}
  </div>
</div>
