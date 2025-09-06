/**
 * LiveKit Screen Sharing Manager - BEST PRACTICES VERSION
 * Using LiveKit's built-in screen sharing methods
 */

import { writable, get } from 'svelte/store';
import { status, room } from './livekit-store.js';

// Screen sharing state stores
export const isScreenSharing = writable(false);

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
    
    console.log('✅ Screen share stopped successfully');
    
  } catch (error) {
    console.error('❌ Error stopping screen share:', error);
    // Set state to false anyway
    isScreenSharing.set(false);
  }
}
