<script>
  import { onMount } from 'svelte';
  import { trackEvent } from '/src/utils/umami.js';
  import Icon from './Icon.svelte';
  
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

<div
  class="flex w-full gap-1 overflow-x-auto rounded-2xl border border-zinc-200/80 bg-white/70 p-1 shadow-card backdrop-blur scrollbar-none sm:inline-flex sm:w-auto dark:border-white/[0.07] dark:bg-white/[0.03] dark:shadow-none"
  role="tablist"
  aria-label="Dashboard-Bereiche"
>
  {#each tabs as tab}
    {@const active = activeTab === tab.id}
    <button
      type="button"
      role="tab"
      aria-selected={active}
      class="flex flex-1 shrink-0 items-center justify-center gap-2 whitespace-nowrap rounded-xl px-3 py-2 text-sm font-medium transition-all sm:flex-none sm:px-4 {active
        ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
        : 'text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:text-zinc-400 dark:hover:bg-white/5 dark:hover:text-white'}"
      on:click={() => setActiveTab(tab.id)}
    >
      <Icon name={tab.icon} size={15} />
      <span>{tab.label}</span>
      {#if tab.count != null}
        <span class="rounded-md px-1.5 py-0.5 text-[11px] font-semibold tabular-nums {active
          ? 'bg-white/15 text-white dark:bg-zinc-900/10 dark:text-zinc-900'
          : 'bg-zinc-100 text-zinc-500 dark:bg-white/10 dark:text-zinc-400'}">{tab.count}</span>
      {/if}
    </button>
  {/each}
</div>
