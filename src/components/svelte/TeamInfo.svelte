<script>
  export let teamSeason;

  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
</script>

<div class="p-6">
  <!-- Team Header -->
  <div class="mb-6">
    <h2 class="text-xl font-bold text-gray-900 mb-2">{teamSeason.name}</h2>
    <div class="flex items-center text-gray-600">
      <span class="text-lg mr-2">📅</span>
      <span>{weekdays[teamSeason.weekdayMatch]} um {teamSeason.throwoffTime}</span>
    </div>
  </div>

  <!-- Team Details -->
  <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900">Team Details</h3>
      
      <div class="space-y-3">
        <div>
          <dt class="text-sm font-medium text-gray-500">Wettkampf Typ</dt>
          <dd class="mt-1 text-sm text-gray-900">{teamSeason.weekTypeCdMatch}</dd>
        </div>
        
        <div>
          <dt class="text-sm font-medium text-gray-500">Meisterschaft</dt>
          <dd class="mt-1">
            {#if teamSeason.competitionChampionship}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                🏆 Ja
              </span>
            {:else}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                Nein
              </span>
            {/if}
          </dd>
        </div>
      </div>
    </div>

    <div class="space-y-4">
      <h3 class="text-lg font-semibold text-gray-900">Spielort</h3>
      
      <div class="space-y-3">
        <div>
          <dt class="text-sm font-medium text-gray-500">Name</dt>
          <dd class="mt-1 text-sm text-gray-900">{teamSeason.playingVenue.name}</dd>
        </div>
        
        <div>
          <dt class="text-sm font-medium text-gray-500">Adresse</dt>
          <dd class="mt-1 text-sm text-gray-900">
            {teamSeason.playingVenue.locationStreet}<br>
            {teamSeason.playingVenue.locationPostalCode} {teamSeason.playingVenue.locationCity}
          </dd>
        </div>
        
        <div>
          <dt class="text-sm font-medium text-gray-500">Status</dt>
          <dd class="mt-1">
            {#if teamSeason.playingVenue.isActive}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                ✓ Aktiv
              </span>
            {:else}
              <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                ✗ Inaktiv
              </span>
            {/if}
          </dd>
        </div>
      </div>
    </div>
  </div>

  <!-- Team Stats -->
  <div class="bg-gray-50 rounded-lg p-4">
    <h3 class="text-lg font-semibold text-gray-900 mb-3">Team Statistik</h3>
    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
      <div>
        <div class="text-2xl font-bold text-blue-600">{teamSeason.teamMembers?.length || 0}</div>
        <div class="text-sm text-gray-500">Mitglieder</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-green-600">
          {teamSeason.teamMembers?.filter(m => m.paid).length || 0}
        </div>
        <div class="text-sm text-gray-500">Bezahlt</div>
      </div>
      <div>
        <div class="text-2xl font-bold text-yellow-600">
          {teamSeason.teamMembers?.filter(m => m.present).length || 0}
        </div>
        <div class="text-sm text-gray-500">Anwesend</div>
      </div>
    </div>
  </div>
</div>