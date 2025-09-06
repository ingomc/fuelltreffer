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

<div class="video-grid-container">
  <!-- Main Video Grid -->
  <div class="video-grid" class:single={!$hasActiveStream} class:with-screen={showScreenShareContainer}>
    {#if isStreamer}
      <!-- Streamer Local Video -->
      <div class="video-container" class:small={showScreenShareContainer}>
        <video 
          bind:this={localVideo}
          class="video-element"
          autoplay 
          muted 
          playsinline
          style="display: none;"
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
      <div bind:this={remoteVideos} class="remote-videos" class:small={showScreenShareContainer}>
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
  <div class="screen-share-test" style="margin: 10px 0; padding: 10px; background: yellow; border: 2px solid red;">
    🔍 DEBUG: isStreamer={isStreamer} | showContainer={showScreenShareContainer} | $isScreenSharing={$isScreenSharing} | hasRemoteScreenShare={hasRemoteScreenShare}
  </div>
  
  {#if showScreenShareContainer}
    <div class="screen-share-container">
      <video 
        bind:this={screenShareVideo}
        class="screen-share-video"
        autoplay 
        playsinline
        controls={false}
        muted={false}
        style="background: #000; min-height: 300px; border: 3px solid green;"
        on:loadstart={() => console.log('📺 Screen share video: loadstart event')}
        on:loadeddata={() => console.log('📺 Screen share video: loadeddata event')}
        on:canplay={() => console.log('📺 Screen share video: canplay event')}
        on:play={() => console.log('📺 Screen share video: play event')}
        on:error={(e) => console.error('📺 Screen share video error:', e)}
      ></video>
      <div class="screen-share-label">
        🖥️ {isStreamer ? 'Dein' : 'Fremder'} Bildschirm wird geteilt (LiveKit Built-in)
      </div>
      <div class="debug-info" style="position: absolute; bottom: 50px; left: 12px; background: rgba(255,255,255,0.9); padding: 8px; font-size: 11px; border-radius: 4px; color: black; font-family: monospace;">
        Role: {isStreamer ? 'STREAMER' : 'VIEWER'}<br/>
        showContainer: {showScreenShareContainer}<br/>
        localScreenSharing: {$isScreenSharing}<br/>
        remoteScreenSharing: {hasRemoteScreenShare}<br/>
        videoElement: {screenShareVideo !== null ? 'bound' : 'null'}<br/>
        srcObject: {screenShareVideo?.srcObject ? 'present' : 'null'}
      </div>
    </div>
  {:else}
    <div style="background: orange; padding: 10px; margin: 10px 0;">
      ❌ DEBUG: Screen share container NOT shown<br/>
      Role: {isStreamer ? 'STREAMER' : 'VIEWER'} | showScreenShareContainer: {showScreenShareContainer}<br/>
      localScreenSharing: {$isScreenSharing} | remoteScreenSharing: {hasRemoteScreenShare}
    </div>
  {/if}
</div>

<style>
  @import './utils/livekit.css';
  
  .video-grid-container {
    display: flex;
    flex-direction: column;
    gap: 16px;
    width: 100%;
  }
  
  .video-grid {
    display: flex;
    gap: 16px;
    width: 100%;
    transition: all 0.3s ease;
  }
  
  .video-grid.with-screen {
    /* Kleinere Kamera-Videos wenn Screen-Sharing aktiv */
    max-height: 300px;
  }
  
  .video-container.small {
    max-width: 400px;
  }
  
  .remote-videos {
    display: contents; /* Allows children to participate in parent's grid */
  }
  
  .remote-videos.small {
    max-height: 300px;
  }
  
  /* Screen Share Styles */
  .screen-share-container {
    position: relative;
    width: 100%;
    background: #000;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  }
  
  .screen-share-video {
    width: 100%;
    height: auto;
    max-height: 70vh;
    object-fit: contain;
    display: block;
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
    
    .video-grid.with-screen {
      max-height: 200px;
    }
    
    .video-container.small {
      max-width: 250px;
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
