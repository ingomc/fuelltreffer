<script>
  import { onMount } from 'svelte';
  import { theme } from '../../stores/theme.js';
  import { trackEvent } from '/src/utils/umami.js';
  import Icon from './Icon.svelte';

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
    { id: 'system', label: 'System', icon: 'monitor', description: 'Folgt Systemeinstellung' },
    { id: 'light', label: 'Hell', icon: 'sun', description: 'Heller Modus' },
    { id: 'dark', label: 'Dunkel', icon: 'moon', description: 'Dunkler Modus' }
  ];

  $: activeTheme = themes.find(t => t.id === currentTheme) || themes[0];

  function cycleTheme() {
    const index = themes.findIndex(t => t.id === currentTheme);
    setTheme(themes[(index + 1) % themes.length].id);
  }
</script>

<!-- Mobile: single button cycling through the modes -->
<button
  type="button"
  class="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-zinc-200 bg-white/80 text-zinc-600 transition-colors hover:text-zinc-900 sm:hidden dark:border-white/10 dark:bg-white/5 dark:text-zinc-300 dark:hover:text-white"
  on:click={cycleTheme}
  aria-label="Darstellung: {activeTheme.label} (wechseln)"
  title="Darstellung: {activeTheme.label}"
  data-track="theme-switch"
  data-track-value={activeTheme.id}
>
  <Icon name={activeTheme.icon} size={16} />
</button>

<!-- Desktop: segmented control -->
<div class="hidden h-9 items-center gap-0.5 rounded-xl border border-zinc-200 bg-white/80 p-1 sm:flex dark:border-white/10 dark:bg-white/5" role="group" aria-label="Darstellung">
  {#each themes as themeOption}
    <button
      type="button"
      class="inline-flex h-7 w-7 items-center justify-center rounded-lg transition-colors {currentTheme === themeOption.id
        ? 'bg-zinc-900 text-white shadow-sm dark:bg-white dark:text-zinc-900'
        : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}"
      on:click={() => setTheme(themeOption.id)}
      aria-pressed={currentTheme === themeOption.id}
      aria-label={themeOption.description}
      title={themeOption.description}
      data-track="theme-switch"
      data-track-value={themeOption.id}
    >
      <Icon name={themeOption.icon} size={14} />
    </button>
  {/each}
</div>
