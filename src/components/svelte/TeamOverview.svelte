<script>
  import { onMount } from 'svelte';
  import Icon from './Icon.svelte';
  import { getInitials } from '../../lib/match-utils';
  
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

<div class="flex flex-col gap-4">
  <div class="grid grid-cols-2 gap-4 xl:grid-cols-4">
    {#each stats as stat}
      <div class="paper flex min-w-0 flex-col gap-2.5 p-4">
        <div class="flex items-center justify-between gap-2">
          <span class="label truncate">{stat.label}</span>
          <span class="shrink-0 text-gray-600 dark:text-dark-200"><Icon name={stat.icon} size={22} strokeWidth={1.5} /></span>
        </div>
        <span class="heading text-[28px] font-bold leading-none tabular-nums">{stat.value}</span>
      </div>
    {/each}
  </div>

  <section class="paper flex flex-col overflow-hidden">
    <div class="paper-head">
      <div>
        <h2 class="paper-title">Kader</h2>
        <p class="dimmed text-xs">{members.length} gemeldete Spieler</p>
      </div>
      <div class="flex gap-0.5 rounded-md bg-gray-100 p-1 dark:bg-dark-800" role="group" aria-label="Ansicht">
        {#each [{ table: false, label: 'Karten', icon: 'grid' }, { table: true, label: 'Liste', icon: 'list' }] as view}
          <button
            type="button"
            aria-pressed={showMembersTable === view.table}
            class="inline-flex min-h-[36px] items-center gap-1.5 rounded-[5px] px-3 text-[13px] font-medium transition-colors {showMembersTable === view.table
              ? 'bg-white text-gray-950 shadow-paper dark:bg-dark-400 dark:text-white dark:shadow-none'
              : 'text-gray-700 hover:text-gray-950 dark:text-dark-150 dark:hover:text-white'}"
            on:click={() => updateView(view.table)}
          >
            <Icon name={view.icon} size={14} strokeWidth={1.6} />
            {view.label}
          </button>
        {/each}
      </div>
    </div>

    {#if members.length === 0}
      <div class="divider flex flex-col items-center border-t px-6 py-12 text-center">
        <span class="text-gray-600 dark:text-dark-200"><Icon name="users" size={28} strokeWidth={1.5} /></span>
        <p class="dimmed mt-3">Keine Mitglieder gefunden</p>
      </div>
    {:else if showMembersTable}
      <div class="overflow-x-auto">
        <table class="w-full border-collapse">
          <thead>
            <tr class="heading text-left">
              <th class="divider border-t py-2.5 pl-5 pr-2 font-bold">Spieler</th>
              <th class="divider border-t px-2 py-2.5 font-bold">Rolle</th>
              <th class="divider border-t py-2.5 pl-2 pr-5 text-right font-bold">Status</th>
            </tr>
          </thead>
          <tbody>
            {#each sortedMembers as member}
              <tr class={isInactive(member) ? 'opacity-60' : ''}>
                <td class="divider border-t py-2.5 pl-5 pr-2">
                  <div class="flex items-center gap-3">
                    <span aria-hidden="true" class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-700 dark:bg-dark-500 dark:text-dark-50">{getInitials(member.displayName)}</span>
                    <span class="heading truncate font-medium">{member.displayName}</span>
                  </div>
                </td>
                <td class="divider border-t px-2 py-2.5">
                  {#if member.tc1}
                    <span class="badge-brand"><Icon name="crown" size={12} />Kapitän 1</span>
                  {:else if member.tc2}
                    <span class="badge-brand"><Icon name="crown" size={12} />Kapitän 2</span>
                  {:else}
                    <span class="dimmed">Spieler</span>
                  {/if}
                </td>
                <td class="divider border-t py-2.5 pl-2 pr-5 text-right">
                  {#if isInactive(member)}
                    <span class="badge-gray" title="Aus dem Team ausgetreten">Inaktiv</span>
                  {:else}
                    <span class="badge-win">Aktiv</span>
                  {/if}
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    {:else}
      <ul class="divider grid gap-3 border-t p-4 sm:grid-cols-2 sm:p-5 2xl:grid-cols-3">
        {#each sortedMembers as member}
          <li class="divider flex items-center gap-3 rounded-xl border p-3 {isInactive(member) ? 'opacity-60' : ''}">
            <span
              aria-hidden="true"
              class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[13px] font-bold {member.tc1 || member.tc2
                ? 'bg-brand-700/10 text-brand-700 dark:bg-brand-700/25 dark:text-brand-300'
                : 'bg-gray-100 text-gray-700 dark:bg-dark-500 dark:text-dark-50'}"
            >{getInitials(member.displayName)}</span>
            <div class="min-w-0 flex-1">
              <p class="heading truncate font-semibold">{member.displayName}</p>
              <p class="dimmed text-xs">
                {#if member.tc1}Kapitän 1{:else if member.tc2}Kapitän 2{:else}Spieler{/if}
              </p>
            </div>
            {#if member.tc1 || member.tc2}
              <span class="badge-brand shrink-0" title={member.tc1 ? 'Team-Kapitän 1' : 'Team-Kapitän 2'}><Icon name="crown" size={12} />{member.tc1 ? 'TC 1' : 'TC 2'}</span>
            {/if}
            {#if isInactive(member)}
              <span class="badge-gray shrink-0" title="Aus dem Team ausgetreten">Inaktiv</span>
            {/if}
          </li>
        {/each}
      </ul>
    {/if}
  </section>
</div>
