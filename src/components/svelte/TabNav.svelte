<script>
  import { onMount } from 'svelte';
  
  export let tabs = [];
  export let activeTab = '';

  function setActiveTab(tabId) {
    activeTab = tabId;
    updateURL(tabId);
  }
  
  function updateURL(tabId) {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  }
  
  onMount(() => {
    // Read tab from URL on component mount
    const urlParams = new URLSearchParams(window.location.search);
    const tabFromUrl = urlParams.get('tab');
    
    // If valid tab from URL and different from current, update activeTab
    if (tabFromUrl && tabs.some(tab => tab.id === tabFromUrl) && tabFromUrl !== activeTab) {
      activeTab = tabFromUrl;
    }
  });
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
        <span>{tab.label}</span>
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