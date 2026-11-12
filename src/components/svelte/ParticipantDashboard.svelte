<script>
  import { onMount } from 'svelte';
  import TeamHeader from './TeamHeader.svelte';
  import StatsGrid from './StatsGrid.svelte';
  import GamesCard from './GamesCard.svelte';
  import NextMatchCard from './NextMatchCard.svelte';
  import FormCard from './FormCard.svelte';
  import LeagueTable from './LeagueTable.svelte';
  import TeamOverview from './TeamOverview.svelte';
  import Icon from './Icon.svelte';
  import { loadLeagueTableEntries } from '../../lib/league-table';
  import { activeTab, navCounts, resolveTab, selectTab } from '../../stores/dashboard.js';
  import { trackDartEvents, trackEvent } from '/src/utils/umami.js';
  import { CURRENT_LEAGUE } from '../../config/league';

  // Props
  export let initialData = null;
  export let apiBaseUrl = '';
  export let defaultParticipantId = CURRENT_LEAGUE.defaultParticipantId;
  export let initialTab = 'overview';

  // State
  let tab = resolveTab(initialTab);
  let data = initialData;
  let loading = false;
  let error = null;
  let currentParticipantId = defaultParticipantId; // Track current participant
  let tableEntries = null;
  let tableError = null;
  let tableViewTracked = false;

  $: teamMembersCount = data?.participant?.teamSeason?.teamMembers?.length || 0;
  $: matches = data?.matches || [];
  $: tableLoading = !tableEntries && !tableError;
  $: tableEntry = tableEntries?.find(entry => entry.participantId === String(currentParticipantId)) || null;

  // The navigation shows these counts next to its links
  $: if (typeof window !== 'undefined' && data) {
    navCounts.set({ matches: matches.length, team: teamMembersCount });
  }

  $: if (typeof window !== 'undefined' && tab === 'table' && !tableViewTracked) {
    tableViewTracked = true;
    trackDartEvents.leagueTableView(CURRENT_LEAGUE.eventId);
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

  async function loadTable() {
    try {
      tableEntries = await loadLeagueTableEntries();
      trackEvent('league_table_loaded', {
        event_id: CURRENT_LEAGUE.eventId,
        teams_count: tableEntries.length,
        current_participant_id: currentParticipantId
      });
    } catch (err) {
      console.error('Error loading league table:', err);
      tableError = err.message || 'Fehler beim Laden der Tabelle';
      trackEvent('league_table_error', {
        event_id: CURRENT_LEAGUE.eventId,
        error_type: err.message || 'unknown'
      });
    }
  }

  onMount(() => {
    // The view comes from the URL; the navigation switches it through the shared store
    tab = resolveTab(new URLSearchParams(window.location.search).get('tab'));
    activeTab.set(tab);
    const stopTab = activeTab.subscribe(value => {
      if (value) tab = value;
    });

    loadTable();

    // If no initial data, load default participant
    if (!data && !error) {
      loadParticipantData(defaultParticipantId);
    }

    return stopTab;
  });
</script>

<div class="mx-auto flex w-full max-w-[1320px] flex-col gap-6 px-4 pt-6 sm:px-6 lg:px-9 lg:pt-7">
  <!-- Loading State -->
  {#if loading}
    <div class="flex flex-col gap-6" aria-busy="true" aria-label="Lade Daten">
      <div class="flex flex-col gap-2">
        <div class="skeleton h-3.5 w-40"></div>
        <div class="skeleton h-8 w-80 max-w-full"></div>
      </div>
      <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
        {#each Array(4) as _}<div class="skeleton h-[104px] rounded-xl"></div>{/each}
      </div>
      <div class="skeleton h-96 rounded-xl"></div>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="paper flex gap-3 p-5" role="alert">
      <span class="shrink-0 text-loss-700 dark:text-loss-400"><Icon name="alert" size={20} strokeWidth={1.6} /></span>
      <div>
        <h2 class="heading font-semibold">Daten konnten nicht geladen werden</h2>
        <p class="dimmed mt-1">{error}</p>
      </div>
    </div>
  {/if}

  <!-- Content -->
  {#if data && !loading}
    <TeamHeader teamData={data} participantId={currentParticipantId} />

    {#if tab === 'overview'}
      <StatsGrid
        {matches}
        participantId={currentParticipantId}
        participant={data.participant}
        {tableEntry}
        tableSize={tableEntries?.length || 0}
        {tableLoading}
      />

      <div class="flex flex-col gap-4 xl:flex-row xl:items-start">
        <div class="order-last min-w-0 xl:order-none xl:flex-[3]">
          <GamesCard
            {matches}
            {currentParticipantId}
            upcomingLimit={3}
            resultsLimit={4}
            onShowAll={() => selectTab('matches')}
          />
        </div>
        <div class="flex min-w-0 flex-col gap-4 xl:w-[340px] xl:shrink-0">
          <NextMatchCard {matches} {currentParticipantId} />
          <FormCard {matches} participantId={currentParticipantId} {tableEntry} />
        </div>
      </div>

      <LeagueTable entries={tableEntries || []} loading={tableLoading} error={tableError} {currentParticipantId} />
    {:else if tab === 'matches'}
      <GamesCard {matches} {currentParticipantId} />
    {:else if tab === 'team'}
      <TeamOverview
        participant={data.participant}
        teamSeason={data.participant.teamSeason}
        members={data.participant.teamSeason.teamMembers || []}
      />
    {:else}
      <LeagueTable entries={tableEntries || []} loading={tableLoading} error={tableError} {currentParticipantId} detailed />
    {/if}
  {/if}
</div>
