<script>
  import { onMount } from 'svelte';
  import { 
    room, 
    participantName, 
    isConnecting, 
    isConnected, 
    isStartingStream, 
    localVideoTrack, 
    hasActiveStream,
    createRoom, 
    connectToRoom, 
    disconnectFromRoom 
  } from './utils/livekit-store.js';
  import { setupParticipantEvents } from './utils/participant-manager.js';
  import { startCamera, stopCamera, publishVideoTrack, unpublishVideoTrack } from './utils/video-manager.js';
  import VideoGrid from './VideoGrid.svelte';
  import ParticipantsList from './ParticipantsList.svelte';
  import { get } from 'svelte/store';

  let localVideo = null;
  let noCameraDiv = null;

  onMount(() => {
    participantName.set(`Streamer-${Date.now()}`);
    connectAsStreamer();
  });

  async function connectAsStreamer() {
    if ($isConnecting) return;
    
    try {
      const currentRoom = createRoom();
      setupParticipantEvents(currentRoom, true);
      
      const response = await fetch('/api/livekit/token', {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      await connectToRoom(data.wsUrl, data.token);
      
    } catch (error) {
      console.error('Error connecting as streamer:', error);
    }
  }

  async function handleStartCamera() {
    try {
      await startCamera(localVideo, noCameraDiv);
    } catch (error) {
      console.error('Error starting camera:', error);
    }
  }

  function handleStopCamera() {
    stopCamera(localVideo, noCameraDiv);
  }

  async function handleStartStream() {
    if (!$room || !$localVideoTrack) return;
    
    try {
      await publishVideoTrack($room);
    } catch (error) {
      console.error('Error starting stream:', error);
    }
  }

  async function handleStopStream() {
    if (!$room) return;
    
    try {
      await unpublishVideoTrack($room);
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  }

  function handleDisconnect() {
    disconnectFromRoom();
  }
</script>

<div class="streamer-view">
  <VideoGrid 
    isStreamer={true} 
    bind:localVideo 
    bind:noCameraDiv 
  />
  
  <div class="stream-controls">
    {#if !$localVideoTrack}
      <button 
        class="control-button primary"
        on:click={handleStartCamera}
        disabled={$isStartingStream}
      >
        {#if $isStartingStream}
          <span class="loading-spinner"></span>
        {:else}
          📹
        {/if}
        Kamera starten
      </button>
    {:else}
      <button 
        class="control-button"
        on:click={handleStopCamera}
      >
        📹 Kamera stoppen
      </button>
      
      {#if !$hasActiveStream}
        <button 
          class="control-button primary"
          on:click={handleStartStream}
          disabled={!$isConnected}
        >
          🔴 Stream starten
        </button>
      {:else}
        <button 
          class="control-button danger"
          on:click={handleStopStream}
        >
          ⏹️ Stream stoppen
        </button>
      {/if}
    {/if}
    
    <button 
      class="control-button"
      on:click={handleDisconnect}
      disabled={!$isConnected && !$isConnecting}
    >
      🚪 Trennen
    </button>
  </div>
  
  <ParticipantsList />
</div>

<style>
  @import './utils/livekit.css';
  
  .streamer-view {
    width: 100%;
  }
</style>
