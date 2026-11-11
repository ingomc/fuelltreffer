<script>
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  import ThemeSwitch from './ThemeSwitch.svelte';
  import { CURRENT_LEAGUE } from '../../config/league';
  import { activeTab, navCounts, selectTab } from '../../stores/dashboard.js';
  import { trackEvent } from '/src/utils/umami.js';

  export let pathname = '/';
  // Dashboard view taken from the URL; null on every other page
  export let initialTab = null;
  export let selectedTeamId = CURRENT_LEAGUE.defaultParticipantId;
  export let showTeamSelector = true;

  const teams = CURRENT_LEAGUE.teams;
  const onDashboard = pathname === '/';

  let currentTab = initialTab;
  let counts = {};

  onMount(() => {
    const stopTab = activeTab.subscribe(value => {
      if (value && onDashboard) currentTab = value;
    });
    const stopCounts = navCounts.subscribe(value => {
      counts = value;
    });
    return () => {
      stopTab();
      stopCounts();
    };
  });

  function tabHref(tab) {
    const params = new URLSearchParams();
    if (selectedTeamId && selectedTeamId !== CURRENT_LEAGUE.defaultParticipantId) {
      params.set('team', selectedTeamId);
    }
    if (tab !== 'overview') params.set('tab', tab);
    const query = params.toString();
    return query ? `/?${query}` : '/';
  }

  $: activeId = pathname.startsWith('/spielorte')
    ? 'venues'
    : pathname.startsWith('/match/') ? 'matches' : currentTab;

  $: items = [
    { id: 'overview', label: 'Übersicht', icon: 'dashboard', href: tabHref('overview'), tab: 'overview' },
    { id: 'matches', label: 'Spiele', icon: 'target', href: tabHref('matches'), tab: 'matches', count: counts.matches },
    { id: 'team', label: 'Team', icon: 'users', href: tabHref('team'), tab: 'team', count: counts.team },
    { id: 'table', label: 'Tabelle', icon: 'table', href: tabHref('table'), tab: 'table' },
    { id: 'venues', label: 'Spielorte', icon: 'map-pin', href: '/spielorte' }
  ];

  // On the dashboard the views switch in place; everywhere else the links navigate.
  function handleNavClick(event, item) {
    if (!item.tab || !onDashboard) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    selectTab(item.tab);
  }

  function changeTeam(event) {
    const teamId = event.currentTarget.value;
    if (!teamId) return;

    trackEvent('team_selected', {
      team_id: teamId,
      team_name: teams.find(team => team.id === teamId)?.name || 'Unknown',
      page: window.location.pathname
    });

    // Keep the current dashboard view; from other pages go to the dashboard.
    const url = new URL(onDashboard ? window.location.href : `${window.location.origin}/`);
    url.searchParams.set('team', teamId);
    window.location.href = url.toString();
  }
</script>

<!-- Mobile: Kopfzeile mit horizontaler Navigation -->
<header class="sticky top-0 z-40 border-b border-gray-300 bg-white lg:hidden dark:border-dark-400 dark:bg-dark-600">
  <div class="flex h-14 items-center gap-3 px-4">
    <a href={tabHref('overview')} class="flex shrink-0 items-center gap-2.5 rounded-md" title="Zur Übersicht">
      <span class="flex h-[34px] w-[34px] items-center justify-center rounded-xl bg-brand-700 text-white">
        <Icon name="target" size={20} strokeWidth={1.8} />
      </span>
      <span class="heading hidden text-lg font-bold min-[400px]:inline">Fülltreffer</span>
    </a>
    <div class="ml-auto flex min-w-0 items-center gap-2">
      {#if showTeamSelector}
        <label class="relative flex min-w-0 items-center">
          <span class="sr-only">Team auswählen</span>
          <select class="field min-w-0 max-w-[52vw] cursor-pointer appearance-none truncate pr-9" value={selectedTeamId} on:change={changeTeam}>
            {#each teams as team}
              <option value={team.id}>{team.name}</option>
            {/each}
          </select>
          <span class="dimmed pointer-events-none absolute right-3"><Icon name="chevron-down" size={16} strokeWidth={1.6} /></span>
        </label>
      {/if}
      <ThemeSwitch variant="icon" />
    </div>
  </div>
  <nav aria-label="Hauptnavigation" class="scrollbar-none flex gap-1 overflow-x-auto px-3 pb-2">
    {#each items as item}
      <a
        href={item.href}
        aria-current={activeId === item.id ? 'page' : undefined}
        class="nav-link min-h-[40px] shrink-0 gap-2 {activeId === item.id ? 'nav-link-active' : ''}"
        on:click={(event) => handleNavClick(event, item)}
      >
        <Icon name={item.icon} size={18} strokeWidth={1.6} />
        {item.label}
      </a>
    {/each}
  </nav>
</header>

<!-- Desktop: Seitenleiste -->
<aside class="sticky top-0 hidden h-screen w-[260px] shrink-0 flex-col gap-5 overflow-y-auto border-r border-gray-300 bg-white p-4 lg:flex dark:border-dark-400 dark:bg-dark-600">
  <div class="divider flex items-center justify-between gap-3 border-b pb-4">
    <a href={tabHref('overview')} class="flex items-center gap-2.5 rounded-md" title="Zur Übersicht">
      <span class="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-xl bg-brand-700 text-white">
        <Icon name="target" size={20} strokeWidth={1.8} />
      </span>
      <span class="heading text-lg font-bold leading-tight">Fülltreffer</span>
    </a>
    <span class="badge-brand">{CURRENT_LEAGUE.name}</span>
  </div>

  <nav aria-label="Hauptnavigation" class="flex flex-col gap-1">
    {#each items as item}
      <a
        href={item.href}
        aria-current={activeId === item.id ? 'page' : undefined}
        class="nav-link {activeId === item.id ? 'nav-link-active' : ''}"
        on:click={(event) => handleNavClick(event, item)}
      >
        <Icon name={item.icon} size={20} strokeWidth={1.6} />
        <span class="min-w-0 flex-1">{item.label}</span>
        {#if item.count}
          <span class="badge-gray h-5 px-2">{item.count}</span>
        {/if}
      </a>
    {/each}
  </nav>

  {#if showTeamSelector}
    <label class="flex flex-col gap-1.5">
      <span class="label">Team</span>
      <span class="relative flex items-center">
        <select class="field cursor-pointer appearance-none truncate pr-9" value={selectedTeamId} on:change={changeTeam}>
          {#each teams as team}
            <option value={team.id}>{team.name}</option>
          {/each}
        </select>
        <span class="dimmed pointer-events-none absolute right-3"><Icon name="chevron-down" size={16} strokeWidth={1.6} /></span>
      </span>
    </label>
  {/if}

  <div class="mt-auto flex flex-col gap-1.5">
    <span class="label">Darstellung</span>
    <ThemeSwitch />
  </div>
</aside>
