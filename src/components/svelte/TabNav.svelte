<script>
  import { onMount } from 'svelte';
  import { trackEvent } from '/src/utils/umami.js';
  
  export let tabs = [];
  export let activeTab = '';

  function setActiveTab(tabId) {
    const previousTab = activeTab;
    activeTab = tabId;
    updateURL(tabId);
    
    // Track tab switch
    trackEvent('tab_switch', {
      from_tab: previousTab,
      to_tab: tabId,
      tabs_available: tabs.map(t => t.id).join(','),
      page: window.location.pathname
    });
  }
  
  function updateURL(tabId) {
    const url = new URL(window.location.href);
    url.searchParams.set('tab', tabId);
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());

    // Manually track page view in Umami if available
    if (typeof window !== 'undefined' && window.umami && typeof window.umami.track === 'function') {
      window.umami.track(props => ({
        ...props,
        url: window.location.pathname + window.location.search
      }));
    }
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
<div class="border-b border-gray-200 dark:border-gray-700 transition-colors duration-200">
  <!-- Mobile: Horizontal scrollable tabs -->
  <div class="flex overflow-x-auto scrollbar-hide space-x-1 sm:space-x-2 px-1">
    {#each tabs as tab}
      <button
        class="flex-shrink-0 flex items-center space-x-2 px-3 py-2 sm:px-4 sm:py-3 text-sm font-medium rounded-t-lg transition-colors whitespace-nowrap"
        class:bg-blue-100={activeTab === tab.id}
        class:dark:bg-blue-900={activeTab === tab.id}
        class:text-blue-700={activeTab === tab.id}
        class:dark:text-blue-300={activeTab === tab.id}
        class:border-b-2={activeTab === tab.id}
        class:border-blue-500={activeTab === tab.id}
        class:dark:border-blue-400={activeTab === tab.id}
        class:text-gray-500={activeTab !== tab.id}
        class:dark:text-gray-400={activeTab !== tab.id}
        class:hover:text-gray-700={activeTab !== tab.id}
        class:dark:hover:text-gray-200={activeTab !== tab.id}
        class:hover:bg-gray-50={activeTab !== tab.id}
        class:dark:hover:bg-gray-800={activeTab !== tab.id}
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