<script>
  import CalendarSubscribe from './CalendarSubscribe.svelte';
  import Icon from './Icon.svelte';
  import { CURRENT_LEAGUE_TITLE } from '../../config/league';

  export let teamData = null;
  export let participantId = '';

  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];

  $: teamSeason = teamData?.participant?.teamSeason;
  $: playingVenue = teamSeason?.playingVenue;
  $: mapsUrl = playingVenue
    ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${playingVenue.locationStreet}, ${playingVenue.locationPostalCode} ${playingVenue.locationCity}`)}`
    : '';
</script>

{#if teamSeason}
  <div class="flex flex-wrap items-end justify-between gap-4">
    <div class="flex min-w-0 flex-col gap-1.5">
      <span class="label">{CURRENT_LEAGUE_TITLE}</span>
      <h1 class="heading text-2xl font-bold leading-tight sm:text-[28px]">{teamSeason.name}</h1>
      <div class="dimmed flex flex-wrap gap-x-5 gap-y-1.5">
        <span class="inline-flex items-center gap-1.5">
          <Icon name="calendar" size={16} strokeWidth={1.6} />
          {weekdays[teamSeason.weekdayMatch] || 'Spieltag offen'}, {teamSeason.throwoffTime?.slice(0, 5) || '–'} Uhr
        </span>
        {#if playingVenue}
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex min-w-0 items-center gap-1.5 rounded-md hover:text-brand-700 dark:hover:text-brand-300"
            title="In Google Maps öffnen"
          >
            <Icon name="map-pin" size={16} strokeWidth={1.6} />
            <span class="truncate">{playingVenue.name}, {playingVenue.locationCity}</span>
          </a>
        {:else}
          <span class="inline-flex items-center gap-1.5">
            <Icon name="map-pin" size={16} strokeWidth={1.6} />
            Kein Spielort definiert
          </span>
        {/if}
      </div>
    </div>
    <CalendarSubscribe {participantId} />
  </div>
{/if}
