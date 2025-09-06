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
import { setupChatHandlers, addSystemMessage } from './chat-manager.js';
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
