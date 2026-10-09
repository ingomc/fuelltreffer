<script>
  import Icon from './Icon.svelte';

  export let label = '';
  export let icon = '';
  export let loading = false;
</script>

<div class="card relative overflow-hidden p-4 sm:p-5">
  <div class="flex items-center gap-2 text-zinc-500 dark:text-zinc-400">
    {#if icon}<Icon name={icon} size={14} />{/if}
    <span class="eyebrow">{label}</span>
  </div>
  <div class="mt-3">
    {#if loading}
      <div class="skeleton h-8 w-16"></div>
      <div class="skeleton mt-2 h-3 w-24"></div>
    {:else}
      <slot />
    {/if}
  </div>
</div>
