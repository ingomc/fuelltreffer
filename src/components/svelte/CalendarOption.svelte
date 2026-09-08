<script>
  export let provider;
  export let address;
  export let onGoogle;
  export let expanded = false;
  const style = 'inline-flex items-center justify-center gap-2 rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-500';
</script>

{#if provider === 'google'}
  <button type="button" on:click={onGoogle} aria-expanded={expanded} aria-controls="google-calendar-help" class={style}>
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" fill="white"/><path d="M3 9h18" stroke="#4285f4" stroke-width="2"/><path d="M7 2v4M17 2v4" stroke="currentColor" stroke-width="2"/><text x="12" y="19" text-anchor="middle" fill="#4285f4" font-size="11" font-weight="bold">G</text></svg>
    Google Kalender
  </button>
{:else}
  <a href={address.replace(/^https?:/, 'webcal:')} class={style}>
    <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="18" rx="3" fill="white"/><path d="M3 7h18" stroke="#ef4444" stroke-width="6"/><text x="12" y="19" text-anchor="middle" fill="#111827" font-size="10" font-weight="bold">17</text></svg>
    Apple Kalender
  </a>
{/if}
