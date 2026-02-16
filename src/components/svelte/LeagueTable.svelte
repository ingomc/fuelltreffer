<script>
  import { onMount } from 'svelte';
  import SectionHeader from './SectionHeader.svelte';
  import { trackDartEvents, trackEvent } from '/src/utils/umami.js';

  export let currentParticipantId = '';
  export let apiBaseUrl = '';

  let tableData = [];
  let loading = false;
  let error = null;
  let eventId = 15995; // Liga E Event ID
  let phaseId = 0;
  let roundIndex = 0;

  async function loadLeagueTable() {
    loading = true;
    error = null;

    try {
      // Track league table view
      trackDartEvents.leagueTableView(eventId);
      
      const response = await fetch(`/api/round/${eventId}/${phaseId}/${roundIndex}/table`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      const entries = data.tableEntries?.[0]?.tableEntries || [];
      
      // Transform API data to our format
      tableData = entries.map(entry => ({
        position: parseInt(entry.placement),
        team: entry.participantName,
        games: entry.matchCount,
        wins: entry.win,
        draws: entry.tie,
        losses: entry.lost,
        points: entry.points1,
        sets: `${entry.sets1}:${entry.sets2}`,
        setDiff: entry.sets1 - entry.sets2,
        legs: `${entry.legs1}:${entry.legs2}`,
        legDiff: entry.legs1 - entry.legs2,
        isCurrentTeam: entry.participantId === parseInt(currentParticipantId)
      }));
      
      // Track successful data load
      trackEvent('league_table_loaded', {
        event_id: eventId,
        teams_count: tableData.length,
        current_participant_id: currentParticipantId
      });
      
    } catch (err) {
      console.error('Error loading league table:', err);
      error = err.message || 'Fehler beim Laden der Tabelle';
      
      // Track error
      trackEvent('league_table_error', {
        event_id: eventId,
        error_type: err.message || 'unknown',
        fallback_to_demo: true
      });
      
      loadDemoData();
    } finally {
      loading = false;
    }
  }

  function loadDemoData() {
    console.log('Loading demo data for league table...');
    tableData = [
      {
        position: 1,
        team: 'SCO-Darts Team Fülltreffer',
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        sets: '0:0',
        setDiff: 0,
        legs: '0:0',
        legDiff: 0,
        isCurrentTeam: true
      },
      {
        position: 2,
        team: 'TSG 2005 Bamberg 2',
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        sets: '0:0',
        setDiff: 0,
        legs: '0:0',
        legDiff: 0,
        isCurrentTeam: false
      },
      {
        position: 3,
        team: 'Erlauer SV',
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        sets: '0:0',
        setDiff: 0,
        legs: '0:0',
        legDiff: 0,
        isCurrentTeam: false
      },
      {
        position: 4,
        team: 'ESV Darter',
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        sets: '0:0',
        setDiff: 0,
        legs: '0:0',
        legDiff: 0,
        isCurrentTeam: false
      },
      {
        position: 5,
        team: 'DC DownFillCreek 2',
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        sets: '0:0',
        setDiff: 0,
        legs: '0:0',
        legDiff: 0,
        isCurrentTeam: false
      },
      {
        position: 6,
        team: 'DC Fire and Ice',
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        sets: '0:0',
        setDiff: 0,
        legs: '0:0',
        legDiff: 0,
        isCurrentTeam: false
      },
      {
        position: 7,
        team: 'LTV Gauerstadt',
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        sets: '0:0',
        setDiff: 0,
        legs: '0:0',
        legDiff: 0,
        isCurrentTeam: false
      },
      {
        position: 8,
        team: 'VFB Einberg 2',
        games: 0,
        wins: 0,
        draws: 0,
        losses: 0,
        points: 0,
        sets: '0:0',
        setDiff: 0,
        legs: '0:0',
        legDiff: 0,
        isCurrentTeam: false
      }
    ];
  }

  onMount(() => {
    console.log('LeagueTable mounted, loading data...');
    loadLeagueTable();
  });
</script>

<div class="p-4 sm:p-6">
  <!-- Header -->
  <SectionHeader 
    title="Liga-Tabelle" 
    subtitle="Liga E • Saison 2025-2" 
    size="large" 
  />

  <!-- Loading State -->
  {#if loading}
    <div class="flex items-center justify-center py-12">
      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 dark:border-blue-400"></div>
      <span class="ml-3 text-gray-600 dark:text-gray-300">Lade Tabelle...</span>
    </div>
  {:else if tableData.length > 0}
    <!-- Desktop Table -->
    <div class="hidden sm:block overflow-x-auto">
      <table class="min-w-full">
        <!-- Table Header -->
        <thead>
          <tr class="bg-gray-600 dark:bg-gray-700 text-white">
            <th rowspan="2" class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider align-middle">Pl.</th>
            <th rowspan="2" class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider align-middle">Mannschaft</th>
            <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider align-middle">Spiele</th>
            <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider align-middle">S</th>
            <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider align-middle">U</th>
            <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider align-middle">N</th>
            <th rowspan="2" class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider align-middle">Punkte</th>
            <th colspan="2" class="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider border-l-2 border-gray-500">Sets</th>
            <th colspan="2" class="px-3 py-2 text-center text-xs font-medium uppercase tracking-wider border-l-2 border-gray-500">Legs</th>
          </tr>
          <tr class="bg-gray-600 dark:bg-gray-700 text-white">
            <th class="px-2 py-2 text-center text-xs font-medium border-l-2 border-gray-500"></th>
            <th class="px-2 py-2 text-center text-xs font-medium">+/-</th>
            <th class="px-2 py-2 text-center text-xs font-medium border-l-2 border-gray-500"></th>
            <th class="px-2 py-2 text-center text-xs font-medium">+/-</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
          {#each tableData as team}
            <tr class="bg-white hover:bg-gray-50 dark:bg-gray-800 dark:hover:bg-gray-700 transition-colors duration-150"
                class:bg-blue-50={team.isCurrentTeam}
                class:dark:bg-blue-900={team.isCurrentTeam}
                class:hover:bg-blue-100={team.isCurrentTeam}
                class:dark:hover:bg-blue-800={team.isCurrentTeam}>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-white">{team.position}.</td>
              <td class="px-3 py-4 text-sm text-gray-900 dark:text-white font-medium">{team.team}</td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">{team.games}</td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">{team.wins}</td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">{team.draws}</td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">{team.losses}</td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white font-semibold">{team.points}</td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white border-l-2 border-gray-200 dark:border-gray-700">{team.sets}</td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">{team.setDiff}</td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white border-l-2 border-gray-200 dark:border-gray-700">{team.legs}</td>
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">{team.legDiff}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>

    <!-- Mobile Cards -->
    <div class="sm:hidden space-y-3">
      {#each tableData as team}
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
             class:bg-blue-50={team.isCurrentTeam}
             class:dark:bg-blue-900={team.isCurrentTeam}
             class:border-blue-200={team.isCurrentTeam}
             class:dark:border-blue-600={team.isCurrentTeam}>
          <div class="flex items-center justify-between mb-3">
            <div class="flex items-center space-x-3">
              <span class="text-lg font-bold text-gray-900 dark:text-white">{team.position}.</span>
              <span class="text-gray-900 dark:text-white font-medium">{team.team}</span>
            </div>
            <span class="text-gray-900 dark:text-white font-bold text-lg">{team.points}</span>
          </div>
          
          <div class="grid grid-cols-4 gap-4 text-sm">
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">Spiele</div>
              <div class="text-gray-900 dark:text-white font-medium">{team.games}</div>
            </div>
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">S/U/N</div>
              <div class="text-gray-900 dark:text-white font-medium">{team.wins}/{team.draws}/{team.losses}</div>
            </div>
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">Games</div>
              <div class="text-gray-900 dark:text-white font-medium">{team.sets}</div>
            </div>
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">Legs</div>
              <div class="text-gray-900 dark:text-white font-medium">{team.legs}</div>
            </div>
          </div>
        </div>
      {/each}
    </div>
  {:else}
    <!-- Empty State -->
    <div class="text-center py-12">
      <p class="text-gray-500 dark:text-gray-400">Keine Tabellendaten verfügbar</p>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mt-4">
      <div class="flex">
        <span class="text-red-400 text-xl mr-3">⚠️</span>
        <div>
          <h3 class="text-sm font-medium text-red-800 dark:text-red-200">Fehler</h3>
          <p class="mt-1 text-sm text-red-700 dark:text-red-300">{error}</p>
          <p class="mt-2 text-xs text-red-600 dark:text-red-400">Demo-Daten werden angezeigt</p>
        </div>
      </div>
    </div>
  {/if}
</div>
