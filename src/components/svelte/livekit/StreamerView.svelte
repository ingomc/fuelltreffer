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
    hasValidName,
    createRoom, 
    connectToRoom, 
    disconnectFromRoom 
  } from './utils/livekit-store.js';
  import { setupParticipantEvents } from './utils/participant-manager.js';
  import { startCamera, stopCamera, publishVideoTrack, unpublishVideoTrack, recreateLocalPreview } from './utils/video-manager.js';
  import { 
    isAudioEnabled, 
    isAudioMuted, 
    startMicrophone, 
    stopMicrophone, 
    publishAudioTrack, 
    unpublishAudioTrack 
  } from './utils/audio-manager.js';
  import { 
    isScreenSharing, 
    startScreenShare, 
    stopScreenShare
  } from './utils/screen-manager.js';
  import { 
    addStreamStartMessage, 
    addStreamStopMessage,
    addScreenShareStartMessage,
    addScreenShareStopMessage
  } from './utils/chat-manager-fixed.js';
  import VideoGrid from './VideoGrid.svelte';
  import ParticipantsList from './ParticipantsList.svelte';
  import ChatWidget from './ChatWidget.svelte';
  import { get } from 'svelte/store';

  let localVideo = null;
  let noCameraDiv = null;
  let screenShareVideo = null;

  // Connect to LiveKit only when user has entered a valid name
  $: if ($hasValidName && $participantName && !$isConnected && !$isConnecting) {
    console.log('Valid name provided, connecting as streamer with name:', $participantName);
    connectAsStreamer();
  }

  async function connectAsStreamer() {
    console.log('Starting streamer connection...');
    if ($isConnecting) {
      console.log('Already connecting, skipping...');
      return;
    }
    
    try {
      const currentRoom = createRoom();
      setupParticipantEvents(currentRoom, true);
      
      const params = new URLSearchParams({
        name: $participantName,
        streamer: 'true'
      });
      
      const tokenUrl = `/api/livekit/token?${params}`;
      console.log('Requesting token from:', tokenUrl);
      console.log('With participant name:', $participantName);
      
      const response = await fetch(tokenUrl, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token request failed:', response.status, errorText);
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Token received successfully:', data);
      await connectToRoom(data.wsUrl, data.token);
      
    } catch (error) {
      console.error('Error connecting as streamer:', error);
      status.set(`Fehler: ${error.message}`);
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
      // Log stream start to chat
      addStreamStartMessage($participantName);
    } catch (error) {
      console.error('Error starting stream:', error);
    }
  }

  async function handleStopStream() {
    if (!$room) return;
    
    try {
      // Stop the stream to LiveKit
      await unpublishVideoTrack($room);
      
      // Log stream stop to chat
      addStreamStopMessage($participantName);
      
      // Recreate local video preview so streamer can still see themselves
      await recreateLocalPreview(localVideo);
      
      console.log('Stream stopped, local preview maintained');
      
    } catch (error) {
      console.error('Error stopping stream:', error);
    }
  }

  function handleDisconnect() {
    disconnectFromRoom();
  }

  // Handle microphone toggle
  async function handleMicrophoneToggle() {
    try {
      if (!$isAudioEnabled) {
        await startMicrophone();
        if ($room && $hasActiveStream) {
          await publishAudioTrack($room);
        }
      } else {
        if ($room && $hasActiveStream) {
          await unpublishAudioTrack($room);
        }
        await stopMicrophone();
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  }

  // Handle screen share toggle - SIMPLIFIED with LiveKit built-in method
  async function handleScreenShareToggle() {
    try {
      if (!$isScreenSharing) {
        await startScreenShare();
        // Log screen share start to chat
        addScreenShareStartMessage($participantName);
      } else {
        await stopScreenShare();
        // Log screen share stop to chat
        addScreenShareStopMessage($participantName);
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }
</script>

<div class="streamer-view">
  <div class="streamer-content">
    <VideoGrid 
      isStreamer={true} 
      bind:localVideo 
      bind:noCameraDiv 
      bind:screenShareVideo
      hasRemoteScreenShare={false}
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
      
      <!-- Media Controls in der gleichen Reihe -->
      {#if $localVideoTrack}
        <button 
          class="control-button {$isAudioEnabled ? 'active' : ''}"
          on:click={handleMicrophoneToggle}
          title={$isAudioEnabled ? 'Mikrofon ausschalten' : 'Mikrofon einschalten'}
        >
          {#if $isAudioEnabled}
            {#if $isAudioMuted}
              🔇
            {:else}
              🎤
            {/if}
          {:else}
            🎤❌
          {/if}
        </button>
        
        <button 
          class="control-button {$isScreenSharing ? 'active' : ''}"
          on:click={handleScreenShareToggle}
          title={$isScreenSharing ? 'Bildschirm teilen beenden' : 'Bildschirm teilen'}
        >
          {#if $isScreenSharing}
            🖥️✅
          {:else}
            🖥️
          {/if}
        </button>
      {/if}
    </div>
    
    <ParticipantsList />
  </div>
  
  <div class="chat-sidebar">
    <ChatWidget />
  </div>
</div>

<style>
  @import './utils/livekit.css';
  
  .streamer-view {
    display: flex;
    gap: 16px;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
  }

  .streamer-content {
    flex: 1;
    min-width: 0; /* Important for flex shrinking */
  }

  .chat-sidebar {
    width: 300px;
    flex-shrink: 0;
  }

  /* Active state for media control buttons */
  .control-button.active {
    background-color: #22c55e;
    color: white;
  }

  .control-button.active:hover {
    background-color: #16a34a;
  }

  @media (max-width: 1024px) {
    .streamer-view {
      flex-direction: column;
    }

    .chat-sidebar {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
  }
</style>
