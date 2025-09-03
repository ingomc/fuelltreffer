<script>
  import { onMount } from 'svelte';
  import SectionHeader from './SectionHeader.svelte';

  export let currentParticipantId = '';
  export let apiBaseUrl = '';

  let tableData = [];
  let loading = false;
  let error = null;
  let eventId = null;

  async function loadLeagueTable() {
    if (!eventId) {
      console.log('No eventId, loading demo data...');
      loadDemoData();
      return;
    }
    
    loading = true;
    error = null;

    try {
      const response = await fetch(`${apiBaseUrl}/api/league-table/${eventId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      tableData = data.standings || [];
    } catch (err) {
      console.error('Error loading league table:', err);
      error = err.message || 'Fehler beim Laden der Tabelle';
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
        legs: '0:0',
        legDiff: 0,
        isCurrentTeam: false
      }
    ];
  }

  onMount(() => {
    console.log('LeagueTable mounted, loading data...');
    // Für Demo-Zwecke laden wir direkt die Demo-Daten
    loadDemoData();
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
            <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">Pl.</th>
            <th class="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider">Mannschaft</th>
            <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">Spiele</th>
            <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">S</th>
            <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">U</th>
            <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">N</th>
            <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">Punkte</th>
            <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">Legs</th>
            <th class="px-3 py-3 text-center text-xs font-medium uppercase tracking-wider">+/-</th>
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
              <td class="px-3 py-4 whitespace-nowrap text-sm text-center text-gray-900 dark:text-white">{team.legs}</td>
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
          
          <div class="grid grid-cols-3 gap-4 text-sm">
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">Spiele</div>
              <div class="text-gray-900 dark:text-white font-medium">{team.games}</div>
            </div>
            <div class="text-center">
              <div class="text-gray-500 dark:text-gray-400">S/U/N</div>
              <div class="text-gray-900 dark:text-white font-medium">{team.wins}/{team.draws}/{team.losses}</div>
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
