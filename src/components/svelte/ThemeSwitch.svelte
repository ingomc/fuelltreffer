<script>
  import { onMount } from 'svelte';
  import { theme } from '../../stores/theme.js';
  import { trackEvent } from '/src/utils/umami.js';

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

  $: themes = [
    { 
      id: 'system', 
      label: 'System', 
      icon: '🖥️',
      description: 'Folgt Systemeinstellung'
    },
    { 
      id: 'light', 
      label: 'Hell', 
      icon: '☀️',
      description: 'Heller Modus'
    },
    { 
      id: 'dark', 
      label: 'Dunkel', 
      icon: '🌙',
      description: 'Dunkler Modus'
    }
  ];
</script>

<div class="flex items-center gap-2">
  <span class="text-xs text-gray-500 dark:text-gray-400 hidden sm:inline">Theme:</span>
  <div class="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
    {#each themes as themeOption}
      <button
        type="button"
        class="flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-md transition-all"
        class:bg-white={currentTheme === themeOption.id && themeOption.id !== 'dark'}
        class:bg-gray-800={currentTheme === themeOption.id && themeOption.id === 'dark'}
        class:text-gray-900={currentTheme === themeOption.id && themeOption.id !== 'dark'}
        class:text-white={currentTheme === themeOption.id && themeOption.id === 'dark'}
        class:shadow-sm={currentTheme === themeOption.id}
        class:text-gray-600={currentTheme !== themeOption.id}
        class:dark:text-gray-300={currentTheme !== themeOption.id}
        class:hover:bg-gray-50={currentTheme !== themeOption.id && themeOption.id !== 'dark'}
        class:dark:hover:bg-gray-600={currentTheme !== themeOption.id}
        on:click={() => setTheme(themeOption.id)}
        title={themeOption.description}
        data-track="theme-switch"
        data-track-value={themeOption.id}
      >
        <span class="text-sm">{themeOption.icon}</span>
        <span>{themeOption.label}</span>
      </button>
    {/each}
  </div>
</div>

<style>
  /* Smooth transitions for theme switching */
  button {
    transition: all 0.2s ease-out;
  }
</style>