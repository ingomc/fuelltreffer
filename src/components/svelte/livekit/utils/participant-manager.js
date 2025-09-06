import { RoomEvent } from 'livekit-client';
import { 
  room, 
  status, 
  isConnected, 
  hasActiveStream,
  updateParticipantsList,
  startParticipantMonitoring,
  stopParticipantMonitoring 
} from './livekit-store.js';
import { setupChatHandlers, addSystemMessage } from './chat-manager-fixed.js';
import { get } from 'svelte/store';

/**
 * Sets up event listeners for a LiveKit room
 */
export function setupParticipantEvents(currentRoom, isStreamer) {
  if (!currentRoom) return;
  
  // Setup chat handlers
  setupChatHandlers(currentRoom);

  // Room connection events
  currentRoom.on(RoomEvent.Connected, () => {
    console.log('Connected to room');
    room.set(currentRoom);
    status.set(isStreamer ? '📹 Bereit zum Streamen' : '👀 Verbunden als Viewer');
    isConnected.set(true);
    startParticipantMonitoring();
    updateParticipantsList();
    
    // Add welcome message for viewer
    if (!isStreamer) {
      addSystemMessage('Willkommen im Stream! 👋');
    }
  });

  // Participant events  
  currentRoom.on(RoomEvent.ParticipantConnected, (participant) => {
    console.log('Participant joined:', participant.identity);
    addSystemMessage(`${participant.identity} ist dem Stream beigetreten`);
    updateParticipantsList();
    
    if (participant.identity.includes('Streamer')) {
      checkForActiveStreams();
    }
    
    // Log screen share status if participant joins with screen share already active
    if (participant.isScreenShareEnabled) {
      console.log(`${participant.identity} joined with screen share already active`);
    }
  });

  currentRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
    console.log('Participant left:', participant.identity);
    addSystemMessage(`${participant.identity} hat den Stream verlassen`);
    updateParticipantsList();
    
    if (participant.identity.includes('Streamer')) {
      checkForActiveStreams();
    }
  });

  currentRoom.on(RoomEvent.Disconnected, (reason) => {
    console.log('Disconnected from room:', reason);
    isConnected.set(false);
    hasActiveStream.set(false);
    stopParticipantMonitoring();
    
    if (reason === 'user-initiated') {
      status.set(isStreamer ? 'Stream beendet' : 'Verbindung getrennt');
    } else {
      status.set('🔄 Reconnecting...');
    }
  });

  // Audio track events for both streamer and viewer
  currentRoom.on(RoomEvent.TrackSubscribed, (track, participant) => {
    if (track.kind === 'audio') {
      console.log(`Audio track subscribed from ${participant.identity}`);
      // Audio tracks are automatically played by LiveKit
      // We just need to make sure they're not muted
      const audioElement = track.attach();
      audioElement.volume = 1.0;
      console.log('Audio track attached and volume set to max');
    }
    // Note: Screen share state is handled in ViewerView.svelte for viewers
    // and in StreamerView.svelte for streamers to avoid conflicts
  });

  currentRoom.on(RoomEvent.TrackUnsubscribed, (track, participant) => {
    if (track.kind === 'audio') {
      console.log(`Audio track unsubscribed from ${participant.identity}`);
      track.detach();
    }
    // Note: Screen share state is handled in ViewerView.svelte for viewers
    // and in StreamerView.svelte for streamers to avoid conflicts
  });

  currentRoom.on(RoomEvent.Reconnecting, () => {
    console.log('Reconnecting...');
    status.set('🔄 Reconnecting...');
    isConnected.set(false);
  });

  currentRoom.on(RoomEvent.Reconnected, () => {
    console.log('Reconnected to room');
    status.set(isStreamer ? '📹 Bereit zum Streamen' : '👀 Verbunden als Viewer');
    isConnected.set(true);
    updateParticipantsList();
  });
}

/**
 * Checks for active video streams in the room
 */
export function checkForActiveStreams() {
  const currentRoom = get(room);
  if (!currentRoom) return;
  
  console.log('Checking for active streams...');
  const remoteParticipants = Array.from(currentRoom.remoteParticipants.values());
  console.log('Remote participants:', remoteParticipants.map(p => p.identity));
  
  const activeVideoTracks = remoteParticipants
    .flatMap(p => Array.from(p.videoTrackPublications.values()))
    .filter(pub => pub.isSubscribed && pub.track);
  
  console.log('Active video tracks:', activeVideoTracks.length);
  hasActiveStream.set(activeVideoTracks.length > 0);
}
