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
import { get } from 'svelte/store';

/**
 * Sets up all participant-related event listeners for a room
 */
export function setupParticipantEvents(currentRoom, isStreamer = false) {
  if (!currentRoom) return;

  // Connection Events
  currentRoom.on(RoomEvent.Connected, () => {
    console.log('Connected to room');
    isConnected.set(true);
    status.set(isStreamer ? '✅ Verbunden!' : '✅ Verbunden! Warte auf Streams...');
    
    updateParticipantsList();
    startParticipantMonitoring();
    
    if (!isStreamer) {
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
    console.log('Reconnected successfully');
    isConnected.set(true);
    status.set(isStreamer ? '✅ Reconnected!' : '✅ Reconnected! Warte auf Streams...');
    
    setTimeout(() => {
      updateParticipantsList();
      if (!isStreamer) {
        checkForActiveStreams();
      }
    }, 1000);
    
    startParticipantMonitoring();
  });

  // Participant Events
  currentRoom.on(RoomEvent.ParticipantConnected, (participant) => {
    console.log('Participant connected:', participant.identity);
    updateParticipantsList();
    
    setTimeout(() => {
      updateParticipantsList();
      if (!isStreamer) {
        checkForActiveStreams();
      }
    }, 1000);
  });

  currentRoom.on(RoomEvent.ParticipantDisconnected, (participant) => {
    console.log('Participant disconnected:', participant.identity);
    updateParticipantsList();
    
    if (!isStreamer) {
      setTimeout(checkForActiveStreams, 500);
    }
  });

  currentRoom.on(RoomEvent.ParticipantMetadataChanged, (_metadata, participant) => {
    console.log('Participant metadata changed:', participant.identity);
    updateParticipantsList();
  });

  currentRoom.on(RoomEvent.ParticipantPermissionsChanged, (_prevPermissions, participant) => {
    console.log('Participant permissions changed:', participant.identity);
    updateParticipantsList();
  });

  currentRoom.on(RoomEvent.ConnectionQualityChanged, (_connectionQuality, _participant) => {
    updateParticipantsList();
  });

  // Track Events (für Viewer)
  if (!isStreamer) {
    currentRoom.on(RoomEvent.TrackSubscribed, (track, _publication, participant) => {
      console.log('Track subscribed:', track.kind, 'from', participant.identity);
      updateParticipantsList();
    });

    currentRoom.on(RoomEvent.TrackUnsubscribed, (track, _publication, participant) => {
      console.log('Track unsubscribed:', track.kind, 'from', participant.identity);
      updateParticipantsList();
    });

    currentRoom.on(RoomEvent.TrackPublished, (publication, participant) => {
      console.log('Track published:', publication.kind, 'from', participant.identity);
      updateParticipantsList();
      setTimeout(checkForActiveStreams, 500);
    });

    currentRoom.on(RoomEvent.TrackUnpublished, (publication, participant) => {
      console.log('Track unpublished:', publication.kind, 'from', participant.identity);
      updateParticipantsList();
      setTimeout(checkForActiveStreams, 500);
    });
  }
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
