<script>
  export let tabs = [];
  export let activeTab = '';

  function setActiveTab(tabId) {
    activeTab = tabId;
  }
</script>

<!-- Mobile-first tab navigation -->
<div class="border-b border-gray-200">
  <!-- Mobile: Horizontal scrollable tabs -->
  <div class="flex overflow-x-auto scrollbar-hide space-x-1 sm:space-x-2 px-1">
    {#each tabs as tab}
      <button
        class="flex-shrink-0 flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap"
        class:bg-blue-100={activeTab === tab.id}
        class:text-blue-700={activeTab === tab.id}
        class:border-b-2={activeTab === tab.id}
        class:border-blue-500={activeTab === tab.id}
        class:text-gray-500={activeTab !== tab.id}
        class:hover:text-gray-700={activeTab !== tab.id}
        class:hover:bg-gray-50={activeTab !== tab.id}
        on:click={() => setActiveTab(tab.id)}
      >
        <span class="text-lg">{tab.icon}</span>
        <span class="hidden sm:inline">{tab.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }
</style>