<script>
  import { 
    isAudioEnabled, 
    isAudioMuted, 
    startMicrophone, 
    stopMicrophone, 
    toggleMicrophone, 
    publishAudioTrack, 
    unpublishAudioTrack 
  } from './utils/audio-manager.js';
  import { 
    isScreenSharing, 
    startScreenShare, 
    stopScreenShare
  } from './utils/screen-manager.js';
  import { room, hasActiveStream } from './utils/livekit-store.js';
  import { get } from 'svelte/store';

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

  // Handle screen share toggle
  async function handleScreenShareToggle() {
    try {
      if (!$isScreenSharing) {
        await startScreenShare();
      } else {
        await stopScreenShare();
      }
    } catch (error) {
      console.error('Error toggling screen share:', error);
    }
  }

  // Handle mute toggle (when mic is already enabled)
  async function handleMuteToggle() {
    try {
      await toggleMicrophone();
    } catch (error) {
      console.error('Error toggling mute:', error);
    }
  }
</script>

<div class="media-controls">
  <!-- Microphone Controls -->
  <div class="control-group">
    <button 
      class="control-btn microphone {$isAudioEnabled ? 'active' : ''}"
      on:click={handleMicrophoneToggle}
      title={$isAudioEnabled ? 'Mikrofon ausschalten' : 'Mikrofon einschalten'}
    >
      {#if $isAudioEnabled}
        🎤
      {:else}
        🎤❌
      {/if}
    </button>
    
    {#if $isAudioEnabled}
      <button 
        class="control-btn mute {$isAudioMuted ? 'muted' : ''}"
        on:click={handleMuteToggle}
        title={$isAudioMuted ? 'Stummschaltung aufheben' : 'Stummschalten'}
      >
        {#if $isAudioMuted}
          🔇
        {:else}
          🔊
        {/if}
      </button>
    {/if}
  </div>

  <!-- Screen Share Controls -->
  <div class="control-group">
    <button 
      class="control-btn screen-share {$isScreenSharing ? 'active' : ''}"
      on:click={handleScreenShareToggle}
      title={$isScreenSharing ? 'Bildschirm teilen beenden' : 'Bildschirm teilen'}
    >
      {#if $isScreenSharing}
        🖥️✅
      {:else}
        🖥️
      {/if}
    </button>
  </div>
</div>

<style>
  .media-controls {
    display: flex;
    gap: 1rem;
    padding: 1rem;
    background: rgba(30, 30, 30, 0.9);
    border-radius: 12px;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.1);
  }

  .control-group {
    display: flex;
    gap: 0.5rem;
  }

  .control-btn {
    padding: 0.75rem;
    border: none;
    border-radius: 8px;
    background: rgba(50, 50, 50, 0.8);
    color: white;
    font-size: 1.2rem;
    cursor: pointer;
    transition: all 0.2s ease;
    min-width: 3rem;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .control-btn:hover {
    background: rgba(70, 70, 70, 0.9);
    transform: translateY(-2px);
  }

  .control-btn:active {
    transform: translateY(0);
  }

  .control-btn.active {
    background: rgba(34, 197, 94, 0.8);
    color: white;
  }

  .control-btn.muted {
    background: rgba(239, 68, 68, 0.8);
    color: white;
  }

  @media (max-width: 768px) {
    .media-controls {
      padding: 0.5rem;
      gap: 0.5rem;
    }

    .control-btn {
      padding: 0.5rem;
      min-width: 2.5rem;
      font-size: 1rem;
    }
  }
</style>
