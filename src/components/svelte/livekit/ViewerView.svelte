<script>
  import { onMount } from 'svelte';
  import { RoomEvent } from 'livekit-client';
  import { 
    room, 
    participantName, 
    isConnecting,
    createRoom, 
    connectToRoom, 
    disconnectFromRoom 
  } from './utils/livekit-store.js';
  import { setupParticipantEvents, checkForActiveStreams } from './utils/participant-manager.js';
  import { handleVideoTrackSubscribed, handleVideoTrackUnsubscribed } from './utils/video-manager.js';
  import VideoGrid from './VideoGrid.svelte';
  import ParticipantsList from './ParticipantsList.svelte';
  import { get } from 'svelte/store';

  let remoteVideos = null;
  let noStreamDiv = null;

  onMount(() => {
    participantName.set(`Viewer-${Date.now()}`);
    connectAsViewer();
  });

  async function connectAsViewer() {
    if ($isConnecting) return;
    
    try {
      const currentRoom = createRoom();
      setupParticipantEvents(currentRoom, false);
      setupViewerEvents(currentRoom);
      
      const params = new URLSearchParams({
        name: $participantName,
        streamer: 'false'
      });
      
      const response = await fetch(`/api/livekit/token?${params}`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      await connectToRoom(data.wsUrl, data.token);
      
    } catch (error) {
      console.error('Error connecting as viewer:', error);
    }
  }

  function setupViewerEvents(currentRoom) {
    // Video track events for viewers
    currentRoom.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
      if (track.kind === 'video') {
        handleVideoTrackSubscribed(track, participant, remoteVideos, noStreamDiv);
      }
    });

    currentRoom.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
      if (track.kind === 'video') {
        handleVideoTrackUnsubscribed(track, participant, remoteVideos, noStreamDiv);
      }
    });

    // Clean up video elements on disconnect
    currentRoom.on(RoomEvent.Disconnected, () => {
      if (remoteVideos) {
        const videoElements = remoteVideos.querySelectorAll('video');
        videoElements.forEach(video => {
          video.srcObject = null;
          video.remove();
        });
        remoteVideos.innerHTML = '';
        
        if (noStreamDiv) {
          noStreamDiv.style.display = 'flex';
        }
      }
    });
  }

  function handleDisconnect() {
    disconnectFromRoom();
  }

  function handleRefresh() {
    checkForActiveStreams();
  }
</script>

<div class="viewer-view">
  <VideoGrid 
    isStreamer={false} 
    bind:remoteVideos 
    bind:noStreamDiv 
  />
  
  <div class="stream-controls">
    <button 
      class="control-button"
      on:click={handleRefresh}
    >
      🔄 Aktualisieren
    </button>
    
    <button 
      class="control-button"
      on:click={handleDisconnect}
    >
      🚪 Trennen
    </button>
  </div>
  
  <ParticipantsList />
</div>

<style>
  @import './utils/livekit.css';
  
  .viewer-view {
    width: 100%;
  }
</style>
