<script>
  import ClickTooltip from './ClickTooltip.svelte';
  
  export let teamData = null;

  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  
  $: teamSeason = teamData?.participant?.teamSeason;
  $: participant = teamData?.participant;
  $: playingVenue = teamSeason?.playingVenue;
  
  function openMaps(venue) {
    if (venue) {
      const address = `${venue.locationStreet}, ${venue.locationPostalCode} ${venue.locationCity}`;
      const encodedAddress = encodeURIComponent(address);
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
    }
  }
</script>

{#if teamData && teamSeason}
  <!-- Team Info Header -->
  <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900 dark:to-purple-900 border-b border-gray-200 dark:border-gray-700 shadow-sm transition-colors duration-200">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 sm:py-4">
      <!-- Team Name & Info -->
      <div class="flex items-center justify-between mb-2 sm:mb-3">
        <div class="flex items-center space-x-2 sm:space-x-3">
          <div class="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500 dark:bg-blue-600 rounded-full flex items-center justify-center transition-colors duration-200">
            <span class="text-white font-bold text-sm sm:text-lg">🎯</span>
          </div>
          <div>
            <h1 class="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100 transition-colors duration-200">{teamSeason.name}</h1>
            <div class="flex items-center gap-1 sm:gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-300 flex-wrap transition-colors duration-200">
              <span>#{participant.rankingPos || 'N/A'}</span>
              <span class="hidden sm:inline">•</span>
              <span class="hidden sm:inline">{participant.currentPosition || 'Position N/A'}</span>
              <span class="sm:hidden">•</span>
              <ClickTooltip text="Beitrag bezahlt" position="bottom">
                <span class="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 transition-colors duration-200">
                  {participant.paid ? '✓' : '○'}
                </span>
              </ClickTooltip>
              <ClickTooltip text="Anwesend beim Training" position="bottom">
                <span class="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300 transition-colors duration-200">
                  {participant.present ? '✓' : '○'}
                </span>
              </ClickTooltip>
            </div>
          </div>
        </div>
      </div>
      
      <!-- Spieltag & Zeit & Ort - 50/50 Layout immer -->
      <div class="grid grid-cols-2 gap-2 sm:gap-4">
        <!-- Spieltag & Zeit -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 shadow-sm transition-colors duration-200">
          <div class="flex items-center space-x-1 sm:space-x-2 mb-1">
            <span class="text-sm sm:text-lg">📅</span>
            <span class="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base transition-colors duration-200">Spieltag</span>
          </div>
          <div class="text-xs sm:text-sm text-gray-600 dark:text-gray-300 transition-colors duration-200">
            <span class="font-medium">{weekdays[teamSeason.weekdayMatch] || 'N/A'}</span>
            <span class="ml-2 text-gray-500 dark:text-gray-400">{teamSeason.throwoffTime?.slice(0, 5) || 'N/A'} Uhr</span>
          </div>
        </div>
        
        <!-- Spielort -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-2 sm:p-3 shadow-sm transition-colors duration-200">
          <div class="flex items-center space-x-1 sm:space-x-2 mb-1">
            <span class="text-sm sm:text-lg">📍</span>
            <span class="font-semibold text-gray-900 dark:text-gray-100 text-sm sm:text-base transition-colors duration-200">Spielort</span>
          </div>
          {#if playingVenue}
            <div class="text-xs sm:text-sm">
              <div class="font-medium text-gray-900 dark:text-gray-100 truncate transition-colors duration-200">{playingVenue.name}</div>
              <button 
                class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 hover:underline text-xs transition-colors text-left mt-1 line-clamp-2"
                on:click={() => openMaps(playingVenue)}
                title="In Google Maps öffnen"
              >
                {playingVenue.locationStreet}, {playingVenue.locationPostalCode} {playingVenue.locationCity}
              </button>
            </div>
          {:else}
            <div class="text-xs sm:text-sm text-gray-500 dark:text-gray-400 transition-colors duration-200">Kein Spielort definiert</div>
          {/if}
        </div>
      </div>
    </div>
  </div>
{/if}