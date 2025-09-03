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
    top: 'top-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-800',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-l-4 border-r-4 border-b-4 border-transparent border-b-gray-800',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-l-4 border-transparent border-l-gray-800',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-t-4 border-b-4 border-r-4 border-transparent border-r-gray-800'
  };
</script>

<div class="relative inline-block">
  <div 
    class="cursor-help inline-block"
    on:click={handleClick}
    role="button"
    tabindex="0"
    on:keydown={(e) => e.key === 'Enter' && handleClick(e)}
  >
    <slot></slot>
  </div>
  
  {#if showTooltip}
    <div 
      bind:this={tooltipElement}
      class="absolute z-50 px-2 py-1 text-xs text-white bg-gray-800 rounded shadow-lg whitespace-nowrap {positionClasses[position]}"
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