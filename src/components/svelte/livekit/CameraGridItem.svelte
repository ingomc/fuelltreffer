<script>
  export let localVideo = null;
  export let noCameraDiv = null;
  
  import { hasActiveStream } from './utils/livekit-store.js';
</script>

<div class="camera-grid-item">
  <!-- Camera Video Element -->
  <video 
    bind:this={localVideo}
    class="video-element camera-video"
    autoplay 
    muted 
    playsinline
    controls={false}
    style="display: none; width: 100%; height: 100%; object-fit: cover;"
  ></video>
  
  <!-- No Camera Placeholder -->
  <div 
    bind:this={noCameraDiv}
    class="no-camera-placeholder"
  >
    <div class="no-camera-icon">📹</div>
    <div class="no-camera-text">Kamera nicht aktiv</div>
    <div class="no-camera-subtitle">Starte die Kamera um zu streamen</div>
  </div>
  
  <!-- Status Indicator -->
  {#if $hasActiveStream}
    <div class="camera-status active">
      🔴 Live
    </div>
  {/if}
</div>

<style>
  .camera-grid-item {
    position: relative;
    width: 100%;
    height: 100%;
    background: #000;
    border-radius: 8px;
    overflow: hidden;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  
  .video-element {
    width: 100%;
    height: 100%;
    object-fit: cover;
    background: #000;
  }
  
  .no-camera-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    height: 100%;
    width: 100%;
  }
  
  .no-camera-icon {
    font-size: 3rem;
    margin-bottom: 12px;
    opacity: 0.8;
  }
  
  .no-camera-text {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 4px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .no-camera-subtitle {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    max-width: 200px;
    line-height: 1.3;
  }
  
  .camera-status {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 6px;
    padding: 4px 8px;
    font-size: 0.8rem;
    font-weight: 600;
    z-index: 5;
  }
  
  .camera-status.active {
    color: #ef4444;
    border: 1px solid rgba(239, 68, 68, 0.3);
  }
  
  @media (max-width: 768px) {
    .no-camera-icon {
      font-size: 2rem;
    }
    
    .no-camera-text {
      font-size: 1rem;
    }
    
    .no-camera-subtitle {
      font-size: 0.8rem;
    }
  }
</style>