<script>
  import ClickTooltip from './ClickTooltip.svelte';
  import Icon from './Icon.svelte';
  import KpiTile from './KpiTile.svelte';
  import { CURRENT_LEAGUE_TITLE } from '../../config/league';
  import { getRecentForm, getMatchOutcome, getInitials, OUTCOME_LABELS } from '../../lib/match-utils';

  export let teamData = null;
  export let participantId = '';
  export let tableEntry = null;
  export let tableSize = 0;
  export let tableLoading = false;

  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  const outcomeStyles = {
    win: 'bg-win-500 text-white',
    loss: 'bg-loss-500 text-white',
    draw: 'bg-draw-400 text-zinc-900'
  };

  $: teamSeason = teamData?.participant?.teamSeason;
  $: participant = teamData?.participant;
  $: playingVenue = teamSeason?.playingVenue;
  $: matches = teamData?.matches || [];
  $: form = getRecentForm(matches, participantId, 5).reverse();

  // Fall back to the participant's own matches when the table is unavailable.
  $: outcomes = matches.map(match => getMatchOutcome(match, participantId)).filter(Boolean);
  $: record = tableEntry
    ? { wins: tableEntry.wins, draws: tableEntry.draws, losses: tableEntry.losses, games: tableEntry.games }
    : {
      wins: outcomes.filter(o => o === 'win').length,
      draws: outcomes.filter(o => o === 'draw').length,
      losses: outcomes.filter(o => o === 'loss').length,
      games: outcomes.length
    };
  $: position = tableEntry?.position || participant?.rankingPos || null;
  $: recordTotal = Math.max(record.wins + record.draws + record.losses, 1);

  function openMaps(venue) {
    if (venue) {
      const address = `${venue.locationStreet}, ${venue.locationPostalCode} ${venue.locationCity}`;
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  }
</script>

{#if teamData && teamSeason}
  <section class="mx-auto max-w-7xl px-4 pb-6 pt-8 sm:px-6 sm:pt-10 lg:px-8">
    <div class="flex animate-fade-up flex-col gap-5 sm:flex-row sm:items-center">
      <div class="relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-400 via-brand-500 to-brand-700 font-display text-2xl font-bold text-white shadow-glow sm:h-20 sm:w-20 sm:text-3xl">
        {getInitials(teamSeason.name)}
        {#if position}
          <span class="absolute -bottom-2 -right-2 rounded-lg border-2 border-zinc-50 bg-zinc-900 px-1.5 py-0.5 text-xs font-bold tabular-nums text-white dark:border-zinc-950 dark:bg-white dark:text-zinc-900">#{position}</span>
        {/if}
      </div>

      <div class="min-w-0 flex-1">
        <div class="mb-2 flex flex-wrap items-center gap-1.5">
          <span class="chip border-brand-200 bg-brand-50 text-brand-700 dark:border-brand-500/30 dark:bg-brand-500/10 dark:text-brand-300">
            <Icon name="trophy" size={12} />
            {CURRENT_LEAGUE_TITLE}
          </span>
          <ClickTooltip text={participant.paid ? 'Beitrag bezahlt' : 'Beitrag offen'} position="bottom">
            <span class="chip">
              <span class="h-1.5 w-1.5 rounded-full {participant.paid ? 'bg-win-500' : 'bg-zinc-400'}"></span>
              Beitrag
            </span>
          </ClickTooltip>
          <ClickTooltip text={participant.present ? 'Anwesend beim Training' : 'Nicht anwesend beim Training'} position="bottom">
            <span class="chip">
              <span class="h-1.5 w-1.5 rounded-full {participant.present ? 'bg-win-500' : 'bg-zinc-400'}"></span>
              Training
            </span>
          </ClickTooltip>
        </div>
        <h1 class="font-display text-[28px] font-bold leading-tight tracking-tight text-zinc-900 sm:text-4xl dark:text-white">{teamSeason.name}</h1>
        <div class="mt-2 flex flex-col gap-1.5 text-sm text-zinc-600 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-5 dark:text-zinc-400">
          <span class="inline-flex items-center gap-2">
            <Icon name="calendar" size={15} class="text-zinc-400" />
            <span><span class="font-medium text-zinc-900 dark:text-zinc-200">{weekdays[teamSeason.weekdayMatch] || 'Spieltag offen'}</span> · {teamSeason.throwoffTime?.slice(0, 5) || '–'} Uhr</span>
          </span>
          {#if playingVenue}
            <button
              type="button"
              class="inline-flex min-w-0 items-center gap-2 rounded-md text-left transition-colors hover:text-brand-600 dark:hover:text-brand-400"
              on:click={() => openMaps(playingVenue)}
              title="In Google Maps öffnen"
            >
              <Icon name="map-pin" size={15} class="text-zinc-400" />
              <span class="truncate"><span class="font-medium text-zinc-900 dark:text-zinc-200">{playingVenue.name}</span> · {playingVenue.locationPostalCode} {playingVenue.locationCity}</span>
              <Icon name="external" size={12} class="opacity-60" />
            </button>
          {:else}
            <span class="inline-flex items-center gap-2">
              <Icon name="map-pin" size={15} class="text-zinc-400" />
              Kein Spielort definiert
            </span>
          {/if}
        </div>
      </div>
    </div>

    <div class="mt-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
      <KpiTile label="Tabellenplatz" icon="trophy" loading={tableLoading && !position}>
        <div class="flex items-baseline gap-1">
          <span class="num text-4xl font-bold text-zinc-900 dark:text-white">{position || '–'}</span>
          {#if position}<span class="num text-xl font-semibold text-zinc-400">.</span>{/if}
        </div>
        <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">{tableSize ? `von ${tableSize} Teams` : 'Aktuelle Platzierung'}</p>
      </KpiTile>

      <KpiTile label="Punkte" icon="chart" loading={tableLoading}>
        <span class="num text-4xl font-bold text-zinc-900 dark:text-white">{tableEntry ? tableEntry.points : '–'}</span>
        <p class="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
          {#if tableEntry}
            Legs <span class="font-medium tabular-nums {tableEntry.legDiff > 0 ? 'text-win-600 dark:text-win-400' : tableEntry.legDiff < 0 ? 'text-loss-600 dark:text-loss-400' : ''}">{tableEntry.legDiff > 0 ? '+' : ''}{tableEntry.legDiff}</span>
          {:else}
            Noch keine Tabelle
          {/if}
        </p>
      </KpiTile>

      <KpiTile label="Bilanz" icon="activity" loading={tableLoading}>
        <div class="num flex items-baseline gap-1.5 text-2xl font-bold sm:text-3xl">
          <span class="text-win-600 dark:text-win-400" title="Siege">{record.wins}</span>
          <span class="text-base text-zinc-300 dark:text-zinc-600">/</span>
          <span class="text-draw-500" title="Unentschieden">{record.draws}</span>
          <span class="text-base text-zinc-300 dark:text-zinc-600">/</span>
          <span class="text-loss-600 dark:text-loss-400" title="Niederlagen">{record.losses}</span>
        </div>
        <div class="mt-2.5 flex h-1.5 overflow-hidden rounded-full bg-zinc-100 dark:bg-white/10" aria-hidden="true">
          <div class="bg-win-500" style="width: {(record.wins / recordTotal) * 100}%"></div>
          <div class="bg-draw-400" style="width: {(record.draws / recordTotal) * 100}%"></div>
          <div class="bg-loss-500" style="width: {(record.losses / recordTotal) * 100}%"></div>
        </div>
        <p class="sr-only">{record.wins} Siege, {record.draws} Unentschieden, {record.losses} Niederlagen</p>
      </KpiTile>

      <KpiTile label="Form" icon="target">
        {#if form.length > 0}
          <div class="flex items-center gap-1.5">
            {#each form as entry}
              <span
                class="flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold sm:h-8 sm:w-8 {outcomeStyles[entry.outcome]}"
                title="{OUTCOME_LABELS[entry.outcome].long}: {entry.match.participantHome?.displayName} – {entry.match.participantGuest?.displayName}"
              >{OUTCOME_LABELS[entry.outcome].short}</span>
            {/each}
          </div>
          <p class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Letzte {form.length} Spiele, neuestes rechts</p>
        {:else}
          <div class="flex items-center gap-1.5" aria-hidden="true">
            {#each Array(5) as _}
              <span class="h-7 w-7 rounded-lg border border-dashed border-zinc-300 sm:h-8 sm:w-8 dark:border-white/15"></span>
            {/each}
          </div>
          <p class="mt-2 text-xs text-zinc-500 dark:text-zinc-400">Noch keine Ergebnisse</p>
        {/if}
      </KpiTile>
    </div>
  </section>
{/if}
