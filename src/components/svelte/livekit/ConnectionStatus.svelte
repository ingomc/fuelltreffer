<script>
  import { status, isConnected, isConnecting, participantCount, showCountBlink } from './utils/livekit-store.js';
</script>

<div class="connection-status">
  <div 
    class="status-indicator" 
    class:connecting={$isConnecting}
    class:disconnected={!$isConnected && !$isConnecting}
  ></div>
  
  <span class="status-text">{$status}</span>
  
  {#if $isConnected}
    <div 
      class="participant-counter" 
      class:blink={$showCountBlink}
    >
      <span>👥</span>
      <span>{$participantCount}</span>
    </div>
  {/if}
</div>

<style>
  @import './utils/livekit.css';
</style>
