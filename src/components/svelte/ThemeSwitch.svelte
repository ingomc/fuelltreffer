<script>
  import { onMount } from 'svelte';
  import { theme } from '../../stores/theme.js';
  import { trackEvent } from '/src/utils/umami.js';
  import Icon from './Icon.svelte';

  // 'segmented' for the sidebar, 'icon' for the compact mobile header
  export let variant = 'segmented';

  let currentTheme = 'system';
  
  // Subscribe to theme changes
  theme.subscribe(value => {
    currentTheme = value;
  });

  onMount(() => {
    theme.init();
  });

  function setTheme(newTheme) {
    // Track theme change
    trackEvent('theme_changed', {
      from_theme: currentTheme,
      to_theme: newTheme,
      page: window.location.pathname
    });
    
    theme.set(newTheme);
  }

  const themes = [
    { id: 'light', label: 'Hell', icon: 'sun', description: 'Heller Modus' },
    { id: 'dark', label: 'Dunkel', icon: 'moon', description: 'Dunkler Modus' },
    { id: 'system', label: 'System', icon: 'monitor', description: 'Folgt Systemeinstellung' }
  ];

  $: activeTheme = themes.find(t => t.id === currentTheme) || themes[2];

  function cycleTheme() {
    const index = themes.findIndex(t => t.id === currentTheme);
    setTheme(themes[(index + 1) % themes.length].id);
  }
</script>

{#if variant === 'icon'}
  <button
    type="button"
    class="btn-default w-11 shrink-0 px-0"
    on:click={cycleTheme}
    aria-label="Darstellung: {activeTheme.label} (wechseln)"
    title="Darstellung: {activeTheme.label}"
    data-track="theme-switch"
    data-track-value={activeTheme.id}
  >
    <Icon name={activeTheme.icon} size={18} strokeWidth={1.6} />
  </button>
{:else}
  <div class="flex gap-0.5 rounded-md bg-gray-100 p-1 dark:bg-dark-800" role="group" aria-label="Darstellung">
    {#each themes as themeOption}
      <button
        type="button"
        class="min-h-[36px] flex-1 rounded-[5px] text-[13px] font-medium transition-colors {currentTheme === themeOption.id
          ? 'bg-white text-gray-950 shadow-paper dark:bg-dark-400 dark:text-white dark:shadow-none'
          : 'text-gray-700 hover:text-gray-950 dark:text-dark-150 dark:hover:text-white'}"
        on:click={() => setTheme(themeOption.id)}
        aria-pressed={currentTheme === themeOption.id}
        title={themeOption.description}
        data-track="theme-switch"
        data-track-value={themeOption.id}
      >
        {themeOption.label}
      </button>
    {/each}
  </div>
{/if}
