<script>
  import { onMount } from 'svelte';
  import { RoomEvent } from 'livekit-client';
  import { 
    room, 
    participantName, 
    isConnecting,
    hasValidName,
    createRoom, 
    connectToRoom, 
    disconnectFromRoom,
    participants 
  } from './utils/livekit-store.js';
  import { setupParticipantEvents, checkForActiveStreams } from './utils/participant-manager.js';
  import { handleVideoTrackSubscribed, handleVideoTrackUnsubscribed } from './utils/video-manager.js';
  import { 
    isAudioEnabled, 
    isAudioMuted, 
    startMicrophone, 
    stopMicrophone, 
    publishAudioTrack, 
    unpublishAudioTrack 
  } from './utils/audio-manager.js';
  import { writable } from 'svelte/store';
  import VideoGrid from './VideoGrid.svelte';
  import ChatWidget from './ChatWidget.svelte';
  import { get } from 'svelte/store';

  let remoteVideos = null;
  let noStreamDiv = null;
  let screenShareVideo = null;

  // SEPARATE State für REMOTE Screen-Sharing (nur für Viewer)
  const hasRemoteScreenShare = writable(false);

  // Debug: Watch remote screen sharing state changes
  $: if (typeof $hasRemoteScreenShare !== 'undefined') {
    console.log('🔍 Viewer: hasRemoteScreenShare state changed:', $hasRemoteScreenShare);
  }

  // Connect to LiveKit only when user has entered a valid name
  $: if ($hasValidName && $participantName && !$isConnecting && !get(room)) {
    console.log('Valid name provided, connecting as viewer with name:', $participantName);
    connectAsViewer();
  }

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
    // Video track events for screen sharing support
    currentRoom.on(RoomEvent.TrackSubscribed, (track, participant) => {
      console.log(`🎬 TRACK SUBSCRIBED: ${track.kind} track "${track.name}" from ${participant.identity}`);
      
      if (track.kind === 'video') {
        // Check if this is a screen share track from REMOTE participant
        const isScreenShare = track.name === 'screen_share' || 
                             track.source === 'screen_share' || 
                             track.name === 'screen' ||
                             participant.isScreenShareEnabled;
        
        if (isScreenShare) {
          console.log(`🖥️ REMOTE SCREEN SHARE track received from ${participant.identity}`);
          console.log('✅ Setting hasRemoteScreenShare to TRUE');
          hasRemoteScreenShare.set(true);
          
          // Ensure screen share video element is ready, retry if needed
          const attachScreenShare = () => {
            if (screenShareVideo) {
              console.log('📱 Screen share video element is ready, attaching track');
              handleVideoTrackSubscribed(track, participant, remoteVideos, noStreamDiv, screenShareVideo);
            } else {
              console.log('⏰ Screen share video element not ready, retrying in 100ms');
              setTimeout(attachScreenShare, 100);
            }
          };
          
          attachScreenShare();
        } else {
          // Regular camera video
          handleVideoTrackSubscribed(track, participant, remoteVideos, noStreamDiv, screenShareVideo);
        }
      }
      // Audio is handled in participant-manager.js
    });

    currentRoom.on(RoomEvent.TrackUnsubscribed, (track, participant) => {
      console.log(`🎬 TRACK UNSUBSCRIBED: ${track.kind} track "${track.name}" from ${participant.identity}`);
      
      if (track.kind === 'video') {
        const isScreenShare = track.name === 'screen_share' || 
                             track.source === 'screen_share' || 
                             track.name === 'screen';
        
        if (isScreenShare) {
          console.log(`🖥️ REMOTE SCREEN SHARE track removed from ${participant.identity}`);
          
          // Check if there are any other screen share tracks before updating state
          const hasOtherScreenShares = Array.from(currentRoom.remoteParticipants.values())
            .some(p => p.isScreenShareEnabled || Array.from(p.videoTrackPublications.values())
              .some(pub => pub.track && (pub.track.name === 'screen_share' || pub.track.source === 'screen_share')));
          
          if (!hasOtherScreenShares) {
            console.log('❌ Setting hasRemoteScreenShare to FALSE');
            hasRemoteScreenShare.set(false);
          } else {
            console.log('ℹ️ Other screen shares still active, keeping state true');
          }
        }
        
        handleVideoTrackUnsubscribed(track, participant, remoteVideos);
      }
      // Audio is handled in participant-manager.js
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

  // Handle microphone toggle for viewer
  async function handleMicrophoneToggle() {
    try {
      if (!$isAudioEnabled) {
        await startMicrophone();
        if ($room) {
          await publishAudioTrack($room);
        }
      } else {
        if ($room) {
          await unpublishAudioTrack($room);
        }
        await stopMicrophone();
      }
    } catch (error) {
      console.error('Error toggling microphone:', error);
    }
  }
</script>

<div class="viewer-view">
  <div class="viewer-content">
    <VideoGrid 
      isStreamer={false} 
      bind:remoteVideos 
      bind:noStreamDiv 
      bind:screenShareVideo
      hasRemoteScreenShare={$hasRemoteScreenShare}
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
      
      
      <!-- Mikrofon für Viewer -->
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
    </div>
    
    <!-- Vereinfachte Teilnehmer-Badges für Viewer -->
    {#if $participants.length > 0}
      <div class="participants-badges">
        <div class="badges-header">
          <span>👥 {$participants.length} Teilnehmer</span>
        </div>
        <div class="badges-container">
          {#each $participants as participant (participant.sid)}
            <div class="participant-badge">
              <div class="badge-avatar">
                {participant.identity.charAt(0).toUpperCase()}
              </div>
              <span class="badge-name">{participant.identity}</span>
              <div class="badge-icons">
                {#if participant.isCameraEnabled}📹{/if}
                {#if participant.isMicrophoneEnabled}🎤{/if}
                {#if participant.isScreenShareEnabled}🖥️{/if}
              </div>
            </div>
          {/each}
        </div>
      </div>
    {/if}
  </div>
  
  <div class="chat-sidebar">
    <ChatWidget />
  </div>
</div>

<style>
  @import './utils/livekit.css';
  
  .viewer-view {
    display: flex;
    gap: 16px;
    width: 100%;
    max-width: 1400px;
    margin: 0 auto;
  }

  .viewer-content {
    flex: 1;
    min-width: 0; /* Important for flex shrinking */
  }

  .chat-sidebar {
    width: 300px;
    flex-shrink: 0;
  }

  /* Active state for microphone button */
  .control-button.active {
    background-color: #22c55e;
    color: white;
  }

  .control-button.active:hover {
    background-color: #16a34a;
  }

  /* Vereinfachte Teilnehmer-Badges */
  .participants-badges {
    margin-top: 20px;
    padding: 16px;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px;
    backdrop-filter: blur(10px);
  }

  .badges-header {
    font-size: 0.9rem;
    font-weight: 600;
    color: rgba(255, 255, 255, 0.8);
    margin-bottom: 12px;
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .badges-container {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .participant-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 6px 10px;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    font-size: 0.8rem;
    color: white;
    transition: all 0.2s ease;
  }

  .participant-badge:hover {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
  }

  .badge-avatar {
    width: 20px;
    height: 20px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 10px;
    font-weight: bold;
    color: white;
  }

  .badge-name {
    font-weight: 500;
    max-width: 100px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .badge-icons {
    display: flex;
    gap: 2px;
    font-size: 0.7rem;
    opacity: 0.8;
  }

  @media (max-width: 1024px) {
    .viewer-view {
      flex-direction: column;
    }

    .chat-sidebar {
      width: 100%;
      max-width: 600px;
      margin: 0 auto;
    }
  }
</style>
