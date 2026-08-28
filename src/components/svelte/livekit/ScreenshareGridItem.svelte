<script>
  export let screenShareVideo = null;
  
  import { isScreenSharing } from './utils/screen-manager.js';
</script>

<div class="screenshare-grid-item">
  {#if $isScreenSharing}
    <!-- Screen Share Video -->
    <video 
      bind:this={screenShareVideo}
      class="screenshare-video"
      autoplay 
      playsinline
      controls={false}
      muted={false}
    ></video>
    
    <!-- Screen Share Label -->
    <div class="screenshare-label active">
      🖥️ Dein Bildschirm wird geteilt
    </div>
  {:else}
    <!-- No Screen Share Placeholder -->
    <div class="no-screenshare-placeholder">
      <div class="no-screenshare-icon">🖥️</div>
      <div class="no-screenshare-text">Bildschirm teilen nicht aktiv</div>
      <div class="no-screenshare-subtitle">Klicke "Bildschirm teilen" um zu starten</div>
    </div>
  {/if}
</div>

<style>
  .screenshare-grid-item {
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
  
  .screenshare-video {
    width: 100%;
    height: 100%;
    object-fit: contain;
    background: #000;
    display: block;
  }
  
  .no-screenshare-placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    text-align: center;
    color: rgba(255, 255, 255, 0.7);
    height: 100%;
    width: 100%;
  }
  
  .no-screenshare-icon {
    font-size: 3rem;
    margin-bottom: 12px;
    opacity: 0.8;
  }
  
  .no-screenshare-text {
    font-size: 1.1rem;
    font-weight: 600;
    margin-bottom: 4px;
    color: rgba(255, 255, 255, 0.9);
  }
  
  .no-screenshare-subtitle {
    font-size: 0.9rem;
    color: rgba(255, 255, 255, 0.6);
    max-width: 240px;
    line-height: 1.3;
  }
  
  .screenshare-label {
    position: absolute;
    top: 8px;
    left: 8px;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    border-radius: 6px;
    padding: 6px 12px;
    font-size: 0.85rem;
    font-weight: 600;
    z-index: 5;
  }
  
  .screenshare-label.active {
    color: #22c55e;
    border: 1px solid rgba(34, 197, 94, 0.3);
  }
  
  @media (max-width: 768px) {
    .no-screenshare-icon {
      font-size: 2rem;
    }
    
    .no-screenshare-text {
      font-size: 1rem;
    }
    
    .no-screenshare-subtitle {
      font-size: 0.8rem;
    }
    
    .screenshare-label {
      font-size: 0.8rem;
      padding: 4px 8px;
    }
  }
</style>