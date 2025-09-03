<script>
  export let participant;

  // Status badges
  function getStatusBadge(condition, trueText, falseText, trueColor = 'green', falseColor = 'red') {
    return {
      text: condition ? trueText : falseText,
      color: condition ? trueColor : falseColor
    };
  }

  $: paidStatus = getStatusBadge(participant.paid, '✓ Bezahlt', '○ Offen');
  $: presentStatus = getStatusBadge(participant.present, '✓ Anwesend', '○ Abwesend', 'green', 'yellow');
</script>

<div class="p-6">
  <!-- Header -->
  <div class="flex items-center space-x-4 mb-6">
    <div class="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
      <span class="text-2xl font-bold text-blue-600">{participant.displayName.charAt(0)}</span>
    </div>
    <div>
      <h2 class="text-xl font-bold text-gray-900">{participant.displayName}</h2>
      <p class="text-gray-500">ID: {participant.id}</p>
    </div>
  </div>

  <!-- Key Stats -->
  <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-sm font-medium text-gray-500 mb-1">Position</h3>
      <p class="text-lg font-semibold text-gray-900">{participant.currentPosition || 'Nicht definiert'}</p>
    </div>
    <div class="bg-gray-50 rounded-lg p-4">
      <h3 class="text-sm font-medium text-gray-500 mb-1">Ranking</h3>
      <p class="text-lg font-semibold text-gray-900">#{participant.rankingPos || 'N/A'}</p>
    </div>
  </div>

  <!-- Status -->
  <div class="space-y-4">
    <h3 class="text-lg font-semibold text-gray-900">Status</h3>
    
    <div class="flex flex-wrap gap-2">
      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-{paidStatus.color}-100 text-{paidStatus.color}-800">
        {paidStatus.text}
      </span>
      <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-{presentStatus.color}-100 text-{presentStatus.color}-800">
        {presentStatus.text}
      </span>
      
      {#if participant.retired}
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800">
          ⊘ Zurückgetreten
        </span>
      {/if}
      
      {#if participant.deregistered}
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
          ⊘ Abgemeldet
        </span>
      {/if}
      
      {#if !participant.retired && !participant.deregistered}
        <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
          ✓ Aktiv
        </span>
      {/if}
    </div>
  </div>
</div>