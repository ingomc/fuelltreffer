<script>
  import { createEventDispatcher } from 'svelte';
  
  export let eventId;
  export let matchId;
  export let originalMatchData = null; // Original match data from the matches list
  export let apiBaseUrl;
  export let isVisible = false;
  
  const dispatch = createEventDispatcher();
  
  let matchDetails = null;
  let loading = false;
  let error = null;
  
  async function fetchMatchDetails() {
    if (!eventId || !matchId) return;
    
    loading = true;
    error = null;
    
    try {
      const response = await fetch(`${apiBaseUrl}/api/match/${eventId}/${matchId}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      matchDetails = await response.json();
    } catch (err) {
      console.error('Error fetching match details:', err);
      error = err.message;
    } finally {
      loading = false;
    }
  }
  
  function closeOverlay() {
    isVisible = false;
    dispatch('close');
  }
  
  function handleBackdropClick(event) {
    if (event.target === event.currentTarget) {
      closeOverlay();
    }
  }
  
  function handleKeydown(event) {
    if (event.key === 'Escape') {
      closeOverlay();
    }
  }
  
  // Fetch data when overlay becomes visible
  $: if (isVisible && eventId && matchId) {
    fetchMatchDetails();
  }
  
  function formatDate(dateString) {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('de-DE', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
</script>

<svelte:window on:keydown={handleKeydown} />

{#if isVisible}
  <!-- Overlay Backdrop -->
  <div 
    class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4"
    on:click={handleBackdropClick}
    on:keydown={handleKeydown}
    role="dialog"
    aria-modal="true"
    tabindex="-1"
  >
    <!-- Modal Content -->
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto transition-colors duration-200">
      <!-- Header -->
      <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 class="text-xl font-bold text-gray-900 dark:text-gray-100">🎯 Match Details</h2>
        <button 
          on:click={closeOverlay}
          class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
          aria-label="Schließen"
        >
          ×
        </button>
      </div>
      
      <!-- Content -->
      <div class="p-6">
        {#if loading}
          <div class="flex items-center justify-center py-12">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        {:else if error}
          <div class="text-center py-12">
            <span class="text-4xl">❌</span>
            <p class="text-red-600 dark:text-red-400 mt-2">Fehler beim Laden der Match-Details</p>
            <p class="text-gray-500 text-sm mt-1">{error}</p>
          </div>
        {:else if matchDetails}
          <!-- Verwende sowohl die API-Details als auch die ursprünglichen Match-Daten -->
          <div class="space-y-6">
            {#if originalMatchData}
              <!-- Teams basierend auf ursprünglichen Daten -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
                <!-- Home Team -->
                <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                  <h4 class="font-bold text-blue-800 dark:text-blue-200 mb-3">🏠 Heimteam</h4>
                  <div class="space-y-2">
                    <div class="font-medium text-blue-900 dark:text-blue-100">{originalMatchData.participantHome?.displayName || 'N/A'}</div>
                    <div class="text-sm text-blue-700 dark:text-blue-300">
                      Ranking: #{originalMatchData.participantHome?.rankingPos || 'N/A'}
                    </div>
                    {#if originalMatchData.participantHome?.teamSeason?.playingVenue}
                      <div class="text-sm text-blue-700 dark:text-blue-300">
                        <div class="font-medium">Spielort:</div>
                        <div class="font-semibold">{originalMatchData.participantHome.teamSeason.playingVenue.name}</div>
                        <div>{originalMatchData.participantHome.teamSeason.playingVenue.locationStreet}</div>
                        <div>{originalMatchData.participantHome.teamSeason.playingVenue.locationPostalCode} {originalMatchData.participantHome.teamSeason.playingVenue.locationCity}</div>
                        <button 
                          class="mt-2 px-2 py-1 bg-blue-600 text-white text-xs rounded hover:bg-blue-700 transition-colors"
                          on:click={() => {
                            const venue = originalMatchData.participantHome.teamSeason.playingVenue;
                            const address = `${venue.locationStreet}, ${venue.locationPostalCode} ${venue.locationCity}`;
                            const encodedAddress = encodeURIComponent(address);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                          }}
                        >
                          📍 In Google Maps öffnen
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
                
                <!-- Guest Team -->
                <div class="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                  <h4 class="font-bold text-green-800 dark:text-green-200 mb-3">🚗 Gastteam</h4>
                  <div class="space-y-2">
                    <div class="font-medium text-green-900 dark:text-green-100">{originalMatchData.participantGuest?.displayName || 'N/A'}</div>
                    <div class="text-sm text-green-700 dark:text-green-300">
                      Ranking: #{originalMatchData.participantGuest?.rankingPos || 'N/A'}
                    </div>
                    {#if originalMatchData.participantGuest?.teamSeason?.playingVenue}
                      <div class="text-sm text-green-700 dark:text-green-300">
                        <div class="font-medium">Heimspielort:</div>
                        <div class="font-semibold">{originalMatchData.participantGuest.teamSeason.playingVenue.name}</div>
                        <div>{originalMatchData.participantGuest.teamSeason.playingVenue.locationStreet}</div>
                        <div>{originalMatchData.participantGuest.teamSeason.playingVenue.locationPostalCode} {originalMatchData.participantGuest.teamSeason.playingVenue.locationCity}</div>
                        <button 
                          class="mt-2 px-2 py-1 bg-green-600 text-white text-xs rounded hover:bg-green-700 transition-colors"
                          on:click={() => {
                            const venue = originalMatchData.participantGuest.teamSeason.playingVenue;
                            const address = `${venue.locationStreet}, ${venue.locationPostalCode} ${venue.locationCity}`;
                            const encodedAddress = encodeURIComponent(address);
                            window.open(`https://www.google.com/maps/search/?api=1&query=${encodedAddress}`, '_blank');
                          }}
                        >
                          📍 In Google Maps öffnen
                        </button>
                      </div>
                    {/if}
                  </div>
                </div>
              </div>

              <!-- Basic Match Info basierend auf ursprünglichen Daten -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 class="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">📅 Match Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span class="font-medium text-gray-600 dark:text-gray-400">Event:</span>
                    <span class="ml-2 text-gray-900 dark:text-gray-100">{originalMatchData.event?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-600 dark:text-gray-400">Runde:</span>
                    <span class="ml-2 text-gray-900 dark:text-gray-100">{originalMatchData.round?.name || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-600 dark:text-gray-400">Datum:</span>
                    <span class="ml-2 text-gray-900 dark:text-gray-100">{formatDate(originalMatchData.datePlanned)}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-600 dark:text-gray-400">Status:</span>
                    <span class="ml-2 text-gray-900 dark:text-gray-100">{originalMatchData.statusCd || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-600 dark:text-gray-400">Spiel-Nr.:</span>
                    <span class="ml-2 text-gray-900 dark:text-gray-100">#{originalMatchData.gameNr || 'N/A'}</span>
                  </div>
                  <div>
                    <span class="font-medium text-gray-600 dark:text-gray-400">Level:</span>
                    <span class="ml-2 text-gray-900 dark:text-gray-100">{originalMatchData.level || 'N/A'}</span>
                  </div>
                </div>
              </div>
            {/if}

            {#if Array.isArray(matchDetails)}
              <!-- Array von Detail-Matches -->
              {@const firstMatch = matchDetails[0]}
              
              <!-- Spielmodus Details -->
              {#if firstMatch && firstMatch.matchmode}
                <div class="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                  <h3 class="font-bold text-lg mb-3 text-blue-900 dark:text-blue-100">🎯 Spielmodus Details</h3>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div class="text-center">
                      <div class="font-medium text-blue-600 dark:text-blue-400">Spieltyp</div>
                      <div class="text-blue-900 dark:text-blue-100 font-bold">{firstMatch.matchmode.matchmodeCd || 'N/A'}</div>
                    </div>
                    <div class="text-center">
                      <div class="font-medium text-blue-600 dark:text-blue-400">Punkte</div>
                      <div class="text-blue-900 dark:text-blue-100 font-bold">{firstMatch.matchmode.matchmodePoints || 'N/A'}</div>
                    </div>
                    <div class="text-center">
                      <div class="font-medium text-blue-600 dark:text-blue-400">In/Out</div>
                      <div class="text-blue-900 dark:text-blue-100 font-bold text-xs">{firstMatch.matchmode.matchmodeInCd} / {firstMatch.matchmode.matchmodeOutCd}</div>
                    </div>
                    <div class="text-center">
                      <div class="font-medium text-blue-600 dark:text-blue-400">Legs</div>
                      <div class="text-blue-900 dark:text-blue-100 font-bold">Best of {firstMatch.matchmode.legsBestOf || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              {/if}
              
              <!-- Einzelspiele -->
              <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <h3 class="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">🏆 Einzelspiele ({matchDetails.length})</h3>
                <div class="space-y-2">
                  {#each matchDetails as game, index}
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-3 flex items-center justify-between">
                      <div class="flex items-center gap-3">
                        <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center text-sm font-bold text-blue-600 dark:text-blue-400">
                          {game.gameNr || index + 1}
                        </div>
                        <div>
                          <div class="font-medium text-gray-900 dark:text-gray-100">
                            {game.matchTypeCd === 'EZ' ? '🏃 Einzelspiel' : 
                             game.matchTypeCd === 'DP' ? '👥 Doppel' : 
                             game.matchTypeCd || 'Spiel'} {game.gameNrRound || ''}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">
                            {game.matchmode?.matchmodePoints} Punkte, Best of {game.matchmode?.legsBestOf}
                          </div>
                        </div>
                      </div>
                      <div class="text-right">
                        <div class="text-sm font-medium text-gray-900 dark:text-gray-100">
                          {game.statusCd === 'OPEN' ? '⏳ Offen' : 
                           game.statusCd === 'FINISHED' ? '✅ Beendet' : 
                           game.statusCd || 'Unbekannt'}
                        </div>
                        {#if game.board}
                          <div class="text-xs text-gray-500 dark:text-gray-400">Board: {game.board}</div>
                        {/if}
                      </div>
                    </div>
                  {/each}
                </div>
              </div>
              
              <!-- Zusätzliche Informationen -->
              {#if firstMatch && firstMatch.phase}
                <div class="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                  <h3 class="font-bold text-lg mb-3 text-green-900 dark:text-green-100">📋 Turnier-Informationen</h3>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span class="font-medium text-green-600 dark:text-green-400">Anzahl Gruppen:</span>
                      <span class="ml-2 text-green-900 dark:text-green-100">{firstMatch.phase.numberOfGroups || 'N/A'}</span>
                    </div>
                    <div>
                      <span class="font-medium text-green-600 dark:text-green-400">Lineup-Typ:</span>
                      <span class="ml-2 text-green-900 dark:text-green-100">{firstMatch.phase.lineupCd || 'N/A'}</span>
                    </div>
                    <div>
                      <span class="font-medium text-green-600 dark:text-green-400">Match-Freigabe:</span>
                      <span class="ml-2 text-green-900 dark:text-green-100">{firstMatch.phase.matchApproval ? '✅ Erforderlich' : '❌ Nicht erforderlich'}</span>
                    </div>
                    <div>
                      <span class="font-medium text-green-600 dark:text-green-400">Eingabetyp:</span>
                      <span class="ml-2 text-green-900 dark:text-green-100">{firstMatch.phase.setInputTypeCd || 'N/A'}</span>
                    </div>
                  </div>
                </div>
              {/if}
            {:else}
              <!-- Fallback für alte Struktur -->
              <!-- Match Details -->
              {#if matchDetails.matchmode}
                <div class="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                  <h3 class="font-bold text-lg mb-3 text-gray-900 dark:text-gray-100">Spielmodus</h3>
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span class="font-medium text-gray-600 dark:text-gray-400">Modus:</span>
                      <div class="text-gray-900 dark:text-gray-100">{matchDetails.matchmode.matchmodeCd || 'N/A'}</div>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600 dark:text-gray-400">Punkte:</span>
                      <div class="text-gray-900 dark:text-gray-100">{matchDetails.matchmode.matchmodePoints || 'N/A'}</div>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600 dark:text-gray-400">Sätze:</span>
                      <div class="text-gray-900 dark:text-gray-100">{matchDetails.matchmode.setsBestOf || 'N/A'}</div>
                    </div>
                    <div>
                      <span class="font-medium text-gray-600 dark:text-gray-400">Legs:</span>
                      <div class="text-gray-900 dark:text-gray-100">{matchDetails.matchmode.legsBestOf || 'N/A'}</div>
                    </div>
                  </div>
                </div>
              {/if}
            {/if}
            
            <!-- Debug: Raw Data (immer anzeigen zum Debugging) -->
            <details class="bg-gray-100 dark:bg-gray-700 rounded-lg p-4">
              <summary class="font-bold text-gray-900 dark:text-gray-100 cursor-pointer">Debug: Raw API Response</summary>
              <pre class="mt-2 text-xs overflow-auto bg-gray-200 dark:bg-gray-600 p-2 rounded text-gray-800 dark:text-gray-200">{JSON.stringify(matchDetails, null, 2)}</pre>
            </details>
          </div>
        {:else}
          <div class="text-center py-12">
            <span class="text-4xl">🎯</span>
            <p class="text-gray-500 dark:text-gray-400 mt-2">Keine Match-Details verfügbar</p>
          </div>
        {/if}
      </div>
    </div>
  </div>
{/if}

<style>
  /* Ensure the overlay is on top of everything */
  :global(body.modal-open) {
    overflow: hidden;
  }
</style>