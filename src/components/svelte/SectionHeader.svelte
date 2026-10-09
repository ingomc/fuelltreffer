<script>
  export let title = '';
  export let subtitle = '';
  export let eyebrow = '';
  export let size = 'default';
</script>

<div class="flex flex-wrap items-end justify-between gap-3">
  <div class="min-w-0">
    {#if eyebrow}
      <p class="eyebrow mb-1">{eyebrow}</p>
    {/if}
    <h2 class="font-display font-semibold tracking-tight text-zinc-900 dark:text-white {size === 'large' ? 'text-xl sm:text-2xl' : 'text-lg'}">{title}</h2>
    {#if subtitle}
      <p class="mt-0.5 text-sm text-zinc-500 dark:text-zinc-400">{subtitle}</p>
    {/if}
  </div>
  <slot />
</div>
