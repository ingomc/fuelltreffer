<script>
  import Icon from './Icon.svelte';
  import { CURRENT_LEAGUE_TITLE } from '../../config/league';
  import { getShortTeamName } from '../../lib/match-utils';

  export let entries = [];
  export let loading = false;
  export let error = null;
  export let currentParticipantId = '';
  // The full view also lists the legs
  export let detailed = false;

  $: rows = entries.map(entry => ({
    ...entry,
    isCurrentTeam: entry.participantId === String(currentParticipantId)
  }));

  const diffClass = (value) => value > 0
    ? 'text-win-700 dark:text-win-400'
    : value < 0 ? 'text-loss-700 dark:text-loss-400' : 'dimmed';
  const signed = (value) => `${value > 0 ? '+' : ''}${value}`;
</script>

<section class="paper flex flex-col overflow-hidden">
  <div class="paper-head items-baseline">
    <h2 class="paper-title">Tabelle</h2>
    <span class="dimmed text-xs">{CURRENT_LEAGUE_TITLE}</span>
  </div>

  {#if loading}
    <div class="divider flex flex-col gap-3 border-t p-5" aria-busy="true" aria-label="Lade Tabelle">
      {#each Array(8) as _}<div class="skeleton h-7 w-full"></div>{/each}
    </div>
  {:else if error}
    <div class="divider flex gap-3 border-t p-5" role="alert">
      <span class="shrink-0 text-loss-700 dark:text-loss-400"><Icon name="alert" size={20} strokeWidth={1.6} /></span>
      <div>
        <h3 class="heading font-semibold">Tabelle konnte nicht geladen werden</h3>
        <p class="dimmed mt-1">{error}</p>
        <p class="dimmed mt-1 text-xs">Es werden keine Ersatzdaten angezeigt.</p>
      </div>
    </div>
  {:else if rows.length === 0}
    <div class="divider flex flex-col items-center border-t px-6 py-12 text-center">
      <span class="text-gray-600 dark:text-dark-200"><Icon name="table" size={28} strokeWidth={1.5} /></span>
      <p class="dimmed mt-3">Die Tabelle wird nach dem ersten gewerteten Spiel angezeigt.</p>
    </div>
  {:else}
    <div class="overflow-x-auto">
      <table class="w-full border-collapse tabular-nums">
        <thead>
          <tr class="heading text-left">
            <th class="divider border-t py-2.5 pl-4 pr-2 font-bold sm:pl-5">Pl.</th>
            <th class="divider border-t px-2 py-2.5 font-bold">Mannschaft</th>
            <th class="divider border-t px-2 py-2.5 text-center font-bold" title="Spiele">Sp</th>
            <th class="divider hidden border-t px-2 py-2.5 text-center font-bold sm:table-cell" title="Siege">S</th>
            <th class="divider hidden border-t px-2 py-2.5 text-center font-bold sm:table-cell" title="Unentschieden">U</th>
            <th class="divider hidden border-t px-2 py-2.5 text-center font-bold sm:table-cell" title="Niederlagen">N</th>
            <th class="divider hidden border-t px-2 py-2.5 text-center font-bold md:table-cell">Sets</th>
            <th class="divider border-t px-2 py-2.5 text-center font-bold" title="Satzdifferenz">+/−</th>
            {#if detailed}
              <th class="divider hidden border-t px-2 py-2.5 text-center font-bold xl:table-cell">Legs</th>
              <th class="divider hidden border-t px-2 py-2.5 text-center font-bold xl:table-cell" title="Legdifferenz">+/−</th>
            {/if}
            <th class="divider border-t py-2.5 pl-2 pr-4 text-right font-bold sm:pr-5">Pkt</th>
          </tr>
        </thead>
        <tbody>
          {#each rows as row}
            <tr class={row.isCurrentTeam ? 'bg-brand-700/[0.07] dark:bg-brand-700/[0.16]' : ''}>
              <td class="divider dimmed border-t py-2.5 pl-4 pr-2 sm:pl-5 {row.isCurrentTeam ? 'shadow-[inset_3px_0_0_theme(colors.brand.700)]' : ''}">{row.position}.</td>
              <td class="divider max-w-[150px] border-t px-2 py-2.5 sm:max-w-none">
                <span class="heading block truncate {row.isCurrentTeam ? 'font-bold' : 'font-medium'}">
                  <span class="sm:hidden">{getShortTeamName({ id: row.participantId, displayName: row.team })}</span>
                  <span class="hidden sm:inline">{row.team}</span>
                </span>
                <span class="dimmed block text-[11px] sm:hidden">{row.wins} S · {row.draws} U · {row.losses} N</span>
              </td>
              <td class="divider border-t px-2 py-2.5 text-center">{row.games}</td>
              <td class="divider hidden border-t px-2 py-2.5 text-center sm:table-cell">{row.wins}</td>
              <td class="divider hidden border-t px-2 py-2.5 text-center sm:table-cell">{row.draws}</td>
              <td class="divider hidden border-t px-2 py-2.5 text-center sm:table-cell">{row.losses}</td>
              <td class="divider dimmed hidden border-t px-2 py-2.5 text-center md:table-cell">{row.sets}</td>
              <td class="divider border-t px-2 py-2.5 text-center font-semibold {diffClass(row.setDiff)}">{signed(row.setDiff)}</td>
              {#if detailed}
                <td class="divider dimmed hidden border-t px-2 py-2.5 text-center xl:table-cell">{row.legs}</td>
                <td class="divider hidden border-t px-2 py-2.5 text-center font-semibold xl:table-cell {diffClass(row.legDiff)}">{signed(row.legDiff)}</td>
              {/if}
              <td class="divider heading border-t py-2.5 pl-2 pr-4 text-right font-bold sm:pr-5">{row.points}</td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
</section>
