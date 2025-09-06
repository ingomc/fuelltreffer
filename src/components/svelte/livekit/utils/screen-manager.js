/**
 * LiveKit Screen Sharing Manager - BEST PRACTICES VERSION
 * Using LiveKit's built-in screen sharing methods
 */

import { writable, get } from 'svelte/store';
import { status, room } from './livekit-store.js';
import { addScreenShareStopMessage } from './chat-manager-fixed.js';

// Screen sharing state stores
export const isScreenSharing = writable(false);

// Track references for cleanup
let currentScreenShareTracks = [];

/**
 * Setup screen share track monitoring
 * This handles browser-initiated stopping (e.g. "Stop sharing" button)
 */
function setupScreenShareMonitoring(track, currentRoom) {
  if (!track || !track.mediaStreamTrack) return;
  
  console.log('🔍 Setting up screen share track monitoring');
  
  // Listen for the MediaStreamTrack 'ended' event
  // This fires when user stops sharing via browser UI
  track.mediaStreamTrack.addEventListener('ended', () => {
    console.log('🛑 Screen share track ended via browser - cleaning up');
    
    // Update our state
    isScreenSharing.set(false);
    
    // Send chat message to all participants
    const participantName = currentRoom.localParticipant?.identity || currentRoom.localParticipant?.name || 'Teilnehmer';
    addScreenShareStopMessage(participantName, currentRoom);
    
    // Clean up tracking
    currentScreenShareTracks = currentScreenShareTracks.filter(t => t !== track);
    
    status.set('🖥️ Bildschirmfreigabe beendet');
  });
  
  // Keep track for cleanup
  currentScreenShareTracks.push(track);
}

/**
 * Start screen sharing using LiveKit's built-in method
 */
export async function startScreenShare() {
  try {
    console.log('🖥️ Starting screen share using LiveKit built-in method...');
    
    const currentRoom = get(room);
    if (!currentRoom) {
      throw new Error('No room connection available');
    }
    
    // Use LiveKit's built-in screen sharing - BEST PRACTICE!
    await currentRoom.localParticipant.setScreenShareEnabled(true);
    
    isScreenSharing.set(true);
    
    // Get the published screen share track and set up monitoring
    const screenSharePub = currentRoom.localParticipant.getTrackPublication('screen_share');
    if (screenSharePub && screenSharePub.track) {
      setupScreenShareMonitoring(screenSharePub.track, currentRoom);
    }
    
    console.log('✅ Screen share started successfully with LiveKit built-in method');
    
  } catch (error) {
    console.error('❌ Error starting screen share:', error);
    status.set(`❌ Bildschirm-Fehler: ${error.message}`);
    throw error;
  }
}

/**
 * Stop screen sharing using LiveKit's built-in method
 */
export async function stopScreenShare() {
  try {
    console.log('🛑 Stopping screen share using LiveKit built-in method...');
    
    const currentRoom = get(room);
    if (!currentRoom) {
      console.warn('No room connection available');
      isScreenSharing.set(false);
      return;
    }
    
    // Use LiveKit's built-in screen sharing - BEST PRACTICE!
    await currentRoom.localParticipant.setScreenShareEnabled(false);
    
    isScreenSharing.set(false);
    
    // Clean up track references
    currentScreenShareTracks = [];
    
    console.log('✅ Screen share stopped successfully');
    
  } catch (error) {
    console.error('❌ Error stopping screen share:', error);
    // Set state to false anyway and clean up
    isScreenSharing.set(false);
    currentScreenShareTracks = [];
  }
}
