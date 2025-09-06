<script>
  import { hasActiveStream } from './utils/livekit-store.js';
  
  export let isStreamer = false;
  export let localVideo = null;
  export let remoteVideos = null;
  export let noCameraDiv = null;
  export let noStreamDiv = null;
</script>

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

<style>
  @import './utils/livekit.css';
  
  .remote-videos {
    display: contents; /* Allows children to participate in parent's grid */
  }
</style>
