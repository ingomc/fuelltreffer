<script>
  import { onMount, onDestroy } from 'svelte';
  import { isStreamer, room, isConnected, reconnectAttempts, hasValidName } from './utils/livekit-store.js';
  import StreamerView from './StreamerView.svelte';
  import ViewerView from './ViewerView.svelte';
  import ConnectionStatus from './ConnectionStatus.svelte';
  import NameInputOverlay from './NameInputOverlay.svelte';
  import { get } from 'svelte/store';

  // Props
  export let mode = 'viewer'; // 'streamer' or 'viewer'

  let mounted = false;

  onMount(() => {
    // Set the initial mode
    isStreamer.set(mode === 'streamer');
    mounted = true;
  });

  onDestroy(() => {
    // Clean up on component destroy
    const currentRoom = get(room);
    if (currentRoom) {
      currentRoom.disconnect();
      room.set(null);
    }
  });
</script>

{#if mounted}
  <!-- Name Input Overlay - OUTSIDE container to avoid blur -->
  {#if !$hasValidName}
    <NameInputOverlay />
  {/if}

  <div class="livekit-container" class:disabled={!$hasValidName}>
    <ConnectionStatus />
    
    {#if mode === 'streamer'}
      <StreamerView />
    {:else}
      <ViewerView />
    {/if}
  </div>
{/if}

<style>
  @import './utils/livekit.css';
  
  .livekit-container {
    width: 100%;
    max-width: 1200px;
    margin: 0 auto;
    padding: 20px;
    box-sizing: border-box;
    transition: all 0.3s ease;
    position: relative;
  }

  .livekit-container.disabled {
    opacity: 0.3;
    pointer-events: none;
    filter: blur(2px);
  }

  @media (max-width: 768px) {
    .livekit-container {
      padding: 10px;
    }
  }
</style>
