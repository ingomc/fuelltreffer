import { writable, derived, get } from 'svelte/store';
import { Room } from 'livekit-client';

// Use globalThis for better compatibility
const clearInterval = globalThis.clearInterval;
const setInterval = globalThis.setInterval;
const setTimeout = globalThis.setTimeout;

// Core room state
export const room = writable(null);
export const isConnected = writable(false);
export const isConnecting = writable(false);
export const status = writable('Bereit');
export const participantName = writable('');
export const isStreamer = writable(false);
export const reconnectAttempts = writable(0);

// Name input state
export const userName = writable('');
export const hasValidName = writable(false);
export const displayName = writable('');
export const chatName = writable(''); // For chat display only

// Stream state
export const hasActiveStream = writable(false);
export const isStartingStream = writable(false);
export const localVideoTrack = writable(null);

// Participants
export const participants = writable([]);
export const participantCount = derived(participants, $participants => $participants.length);

// UI state
export const showNewParticipantBlink = writable(false);
export const showCountBlink = writable(false);
export const expandedParticipant = writable(null);

// Internal state
let participantCheckInterval = null;

/**
 * Creates and configures a new LiveKit room
 */
export function createRoom() {
  const newRoom = new Room({
    reconnectPolicy: {
      nextRetryDelayInMs: (context) => {
        console.log(`Reconnect attempt ${context.retryCount}`);
        return Math.min(1000 * Math.pow(2, context.retryCount), 30000);
      },
      maxRetryCount: Infinity
    },
    disconnectOnPageLeave: true
  });

  room.set(newRoom);
  return newRoom;
}

/**
 * Connects to a LiveKit room with the given token
 */
export async function connectToRoom(wsUrl, token) {
  const currentRoom = get(room);
  if (!currentRoom) {
    throw new Error('Room not created');
  }

  isConnecting.set(true);
  
  try {
    await currentRoom.connect(wsUrl, token);
    isConnected.set(true);
    return currentRoom;
  } catch (error) {
    isConnecting.set(false);
    throw error;
  }
}

/**
 * Disconnects from the current room
 */
export function disconnectFromRoom() {
  const currentRoom = get(room);
  
  if (participantCheckInterval) {
    clearInterval(participantCheckInterval);
    participantCheckInterval = null;
  }

  if (currentRoom) {
    currentRoom.disconnect();
  }

  // Reset all state
  room.set(null);
  isConnected.set(false);
  isConnecting.set(false);
  hasActiveStream.set(false);
  isStartingStream.set(false);
  participants.set([]);
  localVideoTrack.set(null);
}

/**
 * Starts periodic participant checking
 */
export function startParticipantMonitoring() {
  if (participantCheckInterval) {
    clearInterval(participantCheckInterval);
  }

  participantCheckInterval = setInterval(() => {
    const currentRoom = get(room);
    const connected = get(isConnected);
    
    if (currentRoom && connected) {
      updateParticipantsList();
    }
  }, 5000);
}

/**
 * Stops periodic participant checking
 */
export function stopParticipantMonitoring() {
  if (participantCheckInterval) {
    clearInterval(participantCheckInterval);
    participantCheckInterval = null;
  }
}

/**
 * Updates the participants list from the room
 */
export function updateParticipantsList() {
  const currentRoom = get(room);
  
  if (!currentRoom) {
    participants.set([]);
    return;
  }

  // Robuste Teilnehmer-Sammlung
  const localParticipant = currentRoom.localParticipant;
  const remoteParticipants = Array.from(currentRoom.remoteParticipants.values());
  
  const allParticipants = [
    ...(localParticipant && localParticipant.identity ? [localParticipant] : []),
    ...remoteParticipants.filter(p => p && p.identity && p.sid)
  ];

  console.log('Participant count check:', {
    localParticipant: localParticipant?.identity || 'none',
    remoteCount: remoteParticipants.length,
    validRemote: remoteParticipants.filter(p => p && p.identity).length,
    totalValid: allParticipants.length
  });

  const participantList = allParticipants.map(p => ({
    identity: p.identity,
    isLocal: p === currentRoom.localParticipant,
    sid: p.sid,
    connectionState: p.connectionState,
    joinedAt: p.joinedAt,
    metadata: p.metadata,
    name: p.name || p.identity,
    // Audio/Video Status
    isCameraEnabled: p.isCameraEnabled,
    isMicrophoneEnabled: p.isMicrophoneEnabled,
    isScreenShareEnabled: p.isScreenShareEnabled,
    // Track Publications
    audioTrackPublications: Array.from(p.audioTrackPublications.values()).map(pub => ({
      trackSid: pub.trackSid,
      trackName: pub.trackName,
      kind: pub.kind,
      source: pub.source,
      muted: pub.muted,
      enabled: pub.enabled,
      subscribed: pub.subscribed,
      encrypted: pub.encrypted
    })),
    videoTrackPublications: Array.from(p.videoTrackPublications.values()).map(pub => ({
      trackSid: pub.trackSid,
      trackName: pub.trackName,
      kind: pub.kind,
      source: pub.source,
      muted: pub.muted,
      enabled: pub.enabled,
      subscribed: pub.subscribed,
      encrypted: pub.encrypted,
      dimensions: pub.dimensions
    })),
    connectionQuality: p.connectionQuality,
    permissions: p.permissions ? {
      canPublish: p.permissions.canPublish,
      canSubscribe: p.permissions.canSubscribe,
      canPublishData: p.permissions.canPublishData,
      hidden: p.permissions.hidden,
      recorder: p.permissions.recorder
    } : null
  }));

  const currentParticipants = get(participants);
  const newCount = participantList.length;
  const oldCount = currentParticipants.length;
  
  // Blink-Effekt bei Änderung der Teilnehmerzahl
  if (newCount !== oldCount) {
    console.log(`Participant count changed: ${oldCount} → ${newCount}`);
    
    if (oldCount > 0) {
      showCountBlink.set(true);
      showNewParticipantBlink.set(true);
      
      setTimeout(() => {
        showCountBlink.set(false);
        showNewParticipantBlink.set(false);
      }, 800);
    }
  }
  
  participants.set(participantList);

  console.log('Participants updated:', {
    count: newCount,
    participants: participantList.map(p => ({
      identity: p.identity,
      isLocal: p.isLocal,
      connectionState: p.connectionState
    }))
  });
}

/**
 * Toggles expanded details for a participant
 */
export function toggleParticipantDetails(participantSid) {
  const current = get(expandedParticipant);
  expandedParticipant.set(current === participantSid ? null : participantSid);
}
