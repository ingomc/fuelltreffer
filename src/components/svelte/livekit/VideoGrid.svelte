<script>
  import { hasActiveStream } from './utils/livekit-store.js';
  import { isScreenSharing } from './utils/screen-manager.js';
  
  export let isStreamer = false;
  export let localVideo = null;
  export let remoteVideos = null;
  export let noCameraDiv = null;
  export let noStreamDiv = null;
  export let screenShareVideo = null;
  export let hasRemoteScreenShare = false; // NEW: For viewer remote screen share state

  // SIMPLIFIED Screen Share Container Logic:
  // - Streamer: Show when LOCAL screen sharing ($isScreenSharing)
  // - Viewer: Show when REMOTE screen sharing (hasRemoteScreenShare prop)
  $: showScreenShareContainer = isStreamer ? $isScreenSharing : hasRemoteScreenShare;
  
  // Debug logging
  $: console.log('📺 VideoGrid: showScreenShareContainer =', showScreenShareContainer, 
    '| isStreamer =', isStreamer, 
    '| $isScreenSharing =', $isScreenSharing, 
    '| hasRemoteScreenShare =', hasRemoteScreenShare);
</script>

<div class="video-grid-container" class:screen-sharing={showScreenShareContainer}>
  <!-- Main Video Grid -->
  <div class="video-grid" class:single={!$hasActiveStream}>
    {#if isStreamer}
      <!-- Streamer Local Video -->
      <div class="video-container">
        <video 
          bind:this={localVideo}
          class="video-element"
          autoplay 
          muted 
          playsinline
          controls={true}
          style="display: none; width: 100%; height: auto; object-fit: contain;"
        ></video>
        
        <div 
          bind:this={noCameraDiv}
          class="no-camera"
        >
          <div class="no-camera-icon">📹</div>
          <div class="no-camera-text">Kamera nicht aktiv</div>
          <div class="no-camera-subtitle">Starte die Kamera um zu streamen</div>
        </div>
        
        <div class="video-label">Du (Streamer)</div>
      </div>
    {:else}
      <!-- Viewer Remote Videos -->
      <div bind:this={remoteVideos} class="remote-videos">
        <!-- Videos werden dynamisch hinzugefügt -->
      </div>
      
      {#if !$hasActiveStream}
        <div 
          bind:this={noStreamDiv}
          class="no-stream"
        >
          <div class="no-stream-icon">📺</div>
          <div class="no-stream-text">Kein Stream verfügbar</div>
          <div class="no-stream-subtitle">Warten auf Streamer...</div>
        </div>
      {/if}
    {/if}
  </div>
  
  <!-- Screen Share Container -->
  {#if showScreenShareContainer}
    <div class="screen-share-container">
      <video 
        bind:this={screenShareVideo}
        class="screen-share-video"
        autoplay 
        playsinline
        controls={true}
        muted={false}
      ></video>
      <div class="screen-share-label">
        🖥️ {isStreamer ? 'Dein' : 'Fremder'} Bildschirm wird geteilt
      </div>
    </div>
  {/if}
</div>

<style>
  @import './utils/livekit.css';
  
  .video-grid-container {
    /* CSS Custom Properties für dynamische Video-Größen */
    --video-width: 100%;
    --video-height: auto;
    --video-max-width: none;
    --video-max-height: none;
    
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }
  
  /* Kleinere Videos während Screen-Sharing */
  .video-grid-container.screen-sharing {
    --video-width: 400px;
    --video-height: auto;
    --video-max-width: 400px;
    --video-max-height: 300px;
  }
  
  .video-grid {
    display: flex;
    gap: 16px;
    width: 100%;
    transition: all 0.3s ease;
  }
  
  .video-container {
    /* Verwendet CSS Custom Properties */
    width: var(--video-width);
    height: var(--video-height);
    max-width: var(--video-max-width);
    max-height: var(--video-max-height);
    position: relative;
    resize: both;
    overflow: hidden;
    min-width: 200px;
    min-height: 150px;
    border: 2px solid transparent;
    transition: border-color 0.2s ease;
  }
  
  .video-container:hover {
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  .video-container:focus-within {
    border-color: rgba(59, 130, 246, 0.8);
    outline: none;
  }
  
  .remote-videos {
    display: contents;
  }
  
  .video-element {
    width: 100%;
    height: auto;
    object-fit: contain;
    border-radius: 8px;
    background: #000;
  }
  
  /* Screen Share Styles */
  .screen-share-container {
    position: relative;
    width: 100%;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    resize: both;
    min-width: 100px;
    min-height: 300px;
    max-width: 100%;
    max-height: 80vh;
    border: 2px solid transparent;
    transition: border-color 0.2s ease;
  }
  
  .screen-share-container:hover {
    border-color: rgba(34, 197, 94, 0.5);
  }
  
  .screen-share-container:focus-within {
    border-color: rgba(34, 197, 94, 0.8);
    outline: none;
  }
  
  .screen-share-video {
    width: 100%;
    height: auto;
    max-height: 70vh;
    object-fit: contain;
    display: block;
    background: #000;
  }
  
  .screen-share-label {
    position: absolute;
    top: 12px;
    left: 12px;
    background: rgba(0, 0, 0, 0.8);
    color: white;
    padding: 8px 16px;
    border-radius: 6px;
    font-size: 0.9rem;
    font-weight: 500;
    backdrop-filter: blur(10px);
  }
  
  @media (max-width: 768px) {
    .video-grid-container {
      gap: 12px;
    }
    
    /* Mobile: Noch kleinere Videos während Screen-Sharing */
    .video-grid-container.screen-sharing {
      --video-width: 250px;
      --video-height: auto;
      --video-max-width: 250px;
      --video-max-height: 200px;
    }
    
    .screen-share-video {
      max-height: 50vh;
    }
    
    .screen-share-label {
      font-size: 0.8rem;
      padding: 6px 12px;
    }
  }
</style>
