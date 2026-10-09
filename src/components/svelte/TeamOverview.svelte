<script>
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  import { getAvatarStyle, getInitials } from '../../lib/match-utils';
  
  export let participant;
  export let teamSeason;
  export let members = [];

  let showMembersTable = false;
  
  function updateView(isTable) {
    showMembersTable = isTable;
    updateURL(isTable);
  }
  
  function updateURL(isTable) {
    const url = new URL(window.location.href);
    if (isTable) {
      url.searchParams.set('view', 'table');
    } else {
      // Remove view parameter for default (cards) view to keep URL clean
      url.searchParams.delete('view');
    }
    
    // Update URL without page reload
    window.history.replaceState({}, '', url.toString());
  }
  
  onMount(() => {
    // Read view from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const viewFromUrl = urlParams.get('view');
    
    // Set showMembersTable from URL if valid
    if (viewFromUrl === 'table') {
      showMembersTable = true;
    }
    // Default is cards (showMembersTable = false), no URL parameter needed
  });

  const isInactive = (member) => member.dateTo && new Date(member.dateTo) < new Date();

  // Active players first, captains on top; inactive players at the end
  $: sortedMembers = [...members].sort((a, b) =>
    Number(isInactive(a)) - Number(isInactive(b)) ||
    Number(!(a.tc1 || a.tc2)) - Number(!(b.tc1 || b.tc2)) ||
    Number(!a.tc1) - Number(!b.tc1)
  );
  $: stats = [
    { label: 'Spieler', value: members.length, icon: 'users' },
    { label: 'Kapitäne', value: members.filter(m => m.tc1 || m.tc2).length, icon: 'crown' },
    { label: 'Aktiv', value: members.filter(m => !m.dateTo || new Date(m.dateTo) > new Date()).length, icon: 'activity' },
    { label: 'Inaktiv', value: members.filter(m => m.dateTo && new Date(m.dateTo) < new Date()).length, icon: 'user-x' }
  ];
</script>

<div class="space-y-4">
  <div class="grid grid-cols-2 gap-3 sm:grid-cols-4">
    {#each stats as stat}
      <div class="card flex items-center gap-3 p-3 sm:p-4">
        <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-500 dark:bg-white/5 dark:text-zinc-400">
          <Icon name={stat.icon} size={16} />
        </span>
        <div class="leading-tight">
          <p class="num text-xl font-bold text-zinc-900 dark:text-white">{stat.value}</p>
          <p class="text-xs text-zinc-500 dark:text-zinc-400">{stat.label}</p>
        </div>
      </div>
    {/each}
  </div>

  <div class="card overflow-hidden">
    <div class="card-header">
      <div>
        <p class="text-sm font-semibold text-zinc-900 dark:text-white">Kader</p>
        <p class="text-xs text-zinc-500 dark:text-zinc-400">{members.length} gemeldete Spieler</p>
      </div>
      <div class="inline-flex rounded-xl border border-zinc-200 bg-zinc-50 p-0.5 dark:border-white/10 dark:bg-white/5" role="group" aria-label="Ansicht">
        {#each [{ table: false, label: 'Karten', icon: 'grid' }, { table: true, label: 'Liste', icon: 'list' }] as view}
          <button
            type="button"
            aria-pressed={showMembersTable === view.table}
            class="inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors {showMembersTable === view.table
              ? 'bg-white text-zinc-900 shadow-sm dark:bg-white/15 dark:text-white'
              : 'text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white'}"
            on:click={() => updateView(view.table)}
          >
            <Icon name={view.icon} size={13} />
            {view.label}
          </button>
        {/each}
      </div>
    </div>

    {#if members.length === 0}
      <div class="flex flex-col items-center px-6 py-14 text-center">
        <span class="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 dark:bg-white/5">
          <Icon name="users" size={22} />
        </span>
        <p class="mt-3 text-sm text-zinc-500 dark:text-zinc-400">Keine Mitglieder gefunden</p>
      </div>
    {:else if showMembersTable}
      <div class="overflow-x-auto">
        <table class="min-w-full text-sm">
          <thead>
            <tr class="text-left text-[11px] uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
              <th class="px-4 py-2.5 font-semibold sm:px-5">Spieler</th>
              <th class="px-4 py-2.5 font-semibold">Rolle</th>
              <th class="px-4 py-2.5 text-right font-semibold sm:px-5">Status</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-zinc-100 dark:divide-white/[0.05]">
            {#each sortedMembers as member}
              <tr class="transition-colors hover:bg-zinc-50 dark:hover:bg-white/[0.03] {isInactive(member) ? 'opacity-60' : ''}">
                <td class="px-4 py-2.5 sm:px-5">
                  <div class="flex items-center gap-3">
                    <span class="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br text-[11px] font-bold text-white {getAvatarStyle(member.displayName)}">{getInitials(member.displayName)}</span>
                    <span class="truncate font-medium text-zinc-900 dark:text-zinc-100">{member.displayName}</span>
                  </div>
                </td>
                <td class="px-4 py-2.5 text-zinc-600 dark:text-zinc-300">
                  {#if member.tc1}
                    <span class="inline-flex items-center gap-1 text-draw-600 dark:text-draw-400"><Icon name="crown" size={13} /> Kapitän 1</span>
                  {:else if member.tc2}
                    <span class="inline-flex items-center gap-1 text-zinc-600 dark:text-zinc-300"><Icon name="crown" size={13} /> Kapitän 2</span>
                  {:else}
                    <span class="text-zinc-400">Spieler</span>
                  {/if}
                </td>
                <td class="px-4 py-2.5 text-right sm:px-5">
                  {#if isInactive(member)}
                    <span class="inline-flex items-center gap-1.5 text-xs font-medium text-loss-600 dark:text-loss-400" title="Aus dem Team ausgetreten"><span class="h-1.5 w-1.5 rounded-full bg-loss-500"></span>Inaktiv</span>
                  {:else}
                    <span class="inline-flex items-center gap-1.5 text-xs font-medium text-win-600 dark:text-win-400"><span class="h-1.5 w-1.5 rounded-full bg-win-500"></span>Aktiv</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <ul class="grid gap-3 p-3 sm:grid-cols-2 sm:p-4 xl:grid-cols-3">
        {#each sortedMembers as member}
          <li class="group flex items-center gap-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3 transition-colors hover:border-zinc-200 hover:bg-white dark:border-white/[0.05] dark:bg-white/[0.02] dark:hover:border-white/10 dark:hover:bg-white/[0.04] {isInactive(member) ? 'opacity-60' : ''}">
            <span class="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm {getAvatarStyle(member.displayName)}">
              {getInitials(member.displayName)}
              {#if member.tc1 || member.tc2}
                <span class="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border-2 border-white bg-draw-400 text-zinc-900 dark:border-zinc-900" title={member.tc1 ? 'Team-Kapitän 1' : 'Team-Kapitän 2'}>
                  <Icon name="crown" size={10} strokeWidth={2.5} />
                </span>
              {/if}
            </span>
            <div class="min-w-0 flex-1">
              <p class="truncate text-sm font-semibold text-zinc-900 dark:text-white">{member.displayName}</p>
              <p class="text-xs text-zinc-500 dark:text-zinc-400">
                {#if member.tc1}Kapitän 1{:else if member.tc2}Kapitän 2{:else}Spieler{/if}
              </p>
            </div>
            {#if isInactive(member)}
              <span class="rounded-md bg-loss-50 px-2 py-0.5 text-[11px] font-medium text-loss-700 dark:bg-loss-500/10 dark:text-loss-300" title="Aus dem Team ausgetreten">Inaktiv</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </div>
</div>
