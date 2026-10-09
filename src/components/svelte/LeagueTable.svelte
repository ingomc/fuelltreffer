<script>
  import { onMount } from 'svelte';
  import SectionHeader from './SectionHeader.svelte';
  import { trackDartEvents, trackEvent } from '/src/utils/umami.js';
  import Icon from './Icon.svelte';
  import { CURRENT_LEAGUE, CURRENT_LEAGUE_TITLE } from '../../config/league';
  import { loadLeagueTableEntries } from '../../lib/league-table';
  import { getShortTeamName } from '../../lib/match-utils';

  export let currentParticipantId = '';
  export let apiBaseUrl = '';

  let tableData = [];
  let loading = true;
  let error = null;
  const { eventId } = CURRENT_LEAGUE;

  async function loadLeagueTable() {
    loading = true;
    error = null;

    try {
      // Track league table view
      trackDartEvents.leagueTableView(eventId);
      
      const entries = await loadLeagueTableEntries();
      tableData = entries.map(entry => ({
        ...entry,
        isCurrentTeam: entry.participantId === String(currentParticipantId)
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
        error_type: err.message || 'unknown'
      });
    } finally {
      loading = false;
    }
  }

  onMount(() => {
    loadLeagueTable();
  });
</script>

<div class="card overflow-hidden">
  <div class="border-b border-zinc-100 px-4 py-4 sm:px-5 dark:border-white/[0.06]">
    <SectionHeader 
      title="Liga-Tabelle" 
      subtitle={CURRENT_LEAGUE_TITLE}
      size="large" 
    >
      {#if tableData.length > 0}
        <span class="chip"><Icon name="users" size={12} /> {tableData.length} Teams</span>
      {/if}
    </SectionHeader>
  </div>

  <!-- Loading State -->
  {#if loading}
    <div class="space-y-3 p-4 sm:p-5" aria-busy="true" aria-label="Lade Tabelle">
      {#each Array(8) as _}<div class="skeleton h-9 w-full"></div>{/each}
    </div>
  {:else if tableData.length > 0}
    <div class="overflow-x-auto">
      <table class="min-w-full text-sm">
        <thead>
          <tr class="text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
            <th class="py-3 pl-4 pr-2 text-left font-semibold sm:pl-5">Pl.</th>
            <th class="px-2 py-3 text-left font-semibold">Mannschaft</th>
            <th class="px-2 py-3 text-center font-semibold" title="Spiele">Sp</th>
            <th class="hidden px-2 py-3 text-center font-semibold sm:table-cell" title="Siege">S</th>
            <th class="hidden px-2 py-3 text-center font-semibold sm:table-cell" title="Unentschieden">U</th>
            <th class="hidden px-2 py-3 text-center font-semibold sm:table-cell" title="Niederlagen">N</th>
            <th class="hidden border-l border-zinc-100 px-2 py-3 text-center font-semibold md:table-cell dark:border-white/[0.06]">Sets</th>
            <th class="px-2 py-3 text-center font-semibold" title="Satzdifferenz">+/-</th>
            <th class="hidden border-l border-zinc-100 px-2 py-3 text-center font-semibold lg:table-cell dark:border-white/[0.06]">Legs</th>
            <th class="hidden px-2 py-3 text-center font-semibold lg:table-cell" title="Legdifferenz">+/-</th>
            <th class="py-3 pl-2 pr-4 text-right font-semibold sm:pr-5">Pkt</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-zinc-100 dark:divide-white/[0.05]">
          {#each tableData as team}
            <tr class="relative transition-colors {team.isCurrentTeam ? 'bg-brand-50/80 dark:bg-brand-500/10' : 'hover:bg-zinc-50 dark:hover:bg-white/[0.03]'}">
              <td class="relative py-3 pl-4 pr-2 sm:pl-5">
                {#if team.isCurrentTeam}<span class="absolute inset-y-1.5 left-0 w-1 rounded-r-full bg-brand-500"></span>{/if}
                <span class="num inline-flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold {team.position === 1
                  ? 'bg-draw-400 text-zinc-900'
                  : team.isCurrentTeam
                    ? 'bg-brand-600 text-white dark:bg-brand-500'
                    : 'bg-zinc-100 text-zinc-600 dark:bg-white/[0.06] dark:text-zinc-300'}">{team.position}</span>
              </td>
              <td class="max-w-[160px] px-2 py-3 sm:max-w-none">
                <span class="block truncate {team.isCurrentTeam ? 'font-semibold text-zinc-900 dark:text-white' : 'font-medium text-zinc-700 dark:text-zinc-200'}">
                  <span class="sm:hidden">{getShortTeamName({ id: team.participantId, displayName: team.team })}</span>
                  <span class="hidden sm:inline">{team.team}</span>
                </span>
                <span class="text-[11px] tabular-nums text-zinc-400 sm:hidden">{team.wins}S · {team.draws}U · {team.losses}N</span>
              </td>
              <td class="px-2 py-3 text-center tabular-nums text-zinc-600 dark:text-zinc-300">{team.games}</td>
              <td class="hidden px-2 py-3 text-center tabular-nums text-zinc-600 sm:table-cell dark:text-zinc-300">{team.wins}</td>
              <td class="hidden px-2 py-3 text-center tabular-nums text-zinc-600 sm:table-cell dark:text-zinc-300">{team.draws}</td>
              <td class="hidden px-2 py-3 text-center tabular-nums text-zinc-600 sm:table-cell dark:text-zinc-300">{team.losses}</td>
              <td class="hidden border-l border-zinc-100 px-2 py-3 text-center tabular-nums text-zinc-500 md:table-cell dark:border-white/[0.06] dark:text-zinc-400">{team.sets}</td>
              <td class="px-2 py-3 text-center text-xs font-semibold tabular-nums {team.setDiff > 0 ? 'text-win-600 dark:text-win-400' : team.setDiff < 0 ? 'text-loss-600 dark:text-loss-400' : 'text-zinc-400'}">{team.setDiff > 0 ? '+' : ''}{team.setDiff}</td>
              <td class="hidden border-l border-zinc-100 px-2 py-3 text-center tabular-nums text-zinc-500 lg:table-cell dark:border-white/[0.06] dark:text-zinc-400">{team.legs}</td>
              <td class="hidden px-2 py-3 text-center text-xs font-semibold tabular-nums lg:table-cell {team.legDiff > 0 ? 'text-win-600 dark:text-win-400' : team.legDiff < 0 ? 'text-loss-600 dark:text-loss-400' : 'text-zinc-400'}">{team.legDiff > 0 ? '+' : ''}{team.legDiff}</td>
              <td class="py-3 pl-2 pr-4 text-right sm:pr-5">
                <span class="num text-base font-bold text-zinc-900 dark:text-white">{team.points}</span>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
    <p class="border-t border-zinc-100 px-4 py-3 text-[11px] text-zinc-500 sm:px-5 dark:border-white/[0.06] dark:text-zinc-400">
      Sp = Spiele · S/U/N = Siege/Unentschieden/Niederlagen · +/- = Differenz · Pkt = Punkte
    </p>
  {:else if !error}
    <!-- Empty State -->
    <div class="flex flex-col items-center px-6 py-14 text-center">
      <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-white/5">
        <Icon name="trophy" size={22} />
      </span>
      <p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Die Tabelle wird nach dem ersten gewerteten Spiel angezeigt.</p>
    </div>
  {/if}

  <!-- Error State -->
  {#if error}
    <div class="m-4 flex gap-3 rounded-2xl border border-loss-200 bg-loss-50 p-4 dark:border-loss-500/30 dark:bg-loss-500/10" role="alert">
      <Icon name="alert" size={20} class="mt-0.5 text-loss-500" />
      <div>
        <h3 class="text-sm font-semibold text-loss-800 dark:text-loss-200">Tabelle konnte nicht geladen werden</h3>
        <p class="mt-1 text-sm text-loss-700 dark:text-loss-300">{error}</p>
        <p class="mt-2 text-xs text-loss-600 dark:text-loss-400">Es werden keine Ersatzdaten angezeigt.</p>
      </div>
    </div>
  {/if}
</div>
