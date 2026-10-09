<script>
  import { openTooltip } from '../../stores/tooltip.js';
  
  export let text = '';
  export let position = 'top'; // top, bottom, left, right
  
  let showTooltip = false;
  let tooltipElement;
  let tooltipId = Math.random().toString(36).substr(2, 9); // Unique ID for this tooltip
  
  // Subscribe to global tooltip state
  openTooltip.subscribe(value => {
    showTooltip = value === tooltipId;
  });
  
  function handleClick(event) {
    event.stopPropagation();
    
    if (showTooltip) {
      // Close this tooltip
      openTooltip.set(null);
    } else {
      // Open this tooltip (closes any other)
      openTooltip.set(tooltipId);
      
      // Close tooltip when clicking outside
      setTimeout(() => {
        document.addEventListener('click', closeTooltip, { once: true });
      }, 10);
    }
  }
  
  function closeTooltip() {
    openTooltip.set(null);
  }
  
  // Position classes for different tooltip positions
  $: positionClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 transform -translate-y-1/2 ml-2'
  };
  
  $: arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-zinc-900 dark:border-t-zinc-100',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-zinc-900 dark:border-b-zinc-100',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-zinc-900 dark:border-l-zinc-100',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-zinc-900 dark:border-r-zinc-100'
  };
</script>

<div class="relative inline-block">
  <button 
    type="button"
    class="m-0 inline-block cursor-help rounded-full border-none bg-transparent p-0"
    on:click={handleClick}
    on:keydown={(e) => e.key === 'Enter' && handleClick(e)}
  >
    <slot></slot>
  </button>
  
  {#if showTooltip}
    <div 
      bind:this={tooltipElement}
      class="animate-fade-in absolute z-50 whitespace-nowrap rounded-lg bg-zinc-900 px-2.5 py-1.5 text-xs font-medium text-white shadow-lg dark:bg-zinc-100 dark:text-zinc-900 {positionClasses[position]}"
      style="visibility: visible;"
    >
      {text}
      <!-- Arrow -->
      <div class="absolute w-0 h-0 {arrowClasses[position]}"></div>
    </div>
  {/if}
</div>

<style>
  @keyframes fade-in {
    from {
      opacity: 0;
      transform: scale(0.95);
    }
    to {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  .animate-fade-in {
    animation: fade-in 0.15s ease-out;
  }
</style>