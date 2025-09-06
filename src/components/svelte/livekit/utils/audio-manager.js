/**
 * LiveKit Audio Manager
 * Handles microphone controls and audio track publishing
 */

import { writable, get } from 'svelte/store';
import { LocalAudioTrack } from 'livekit-client';
import { status } from './livekit-store.js';

// Use globalThis for better compatibility
const navigator = globalThis.navigator;

// Audio state stores
export const localAudioTrack = writable(null);
export const isAudioEnabled = writable(false);
export const isAudioMuted = writable(true);

/**
 * Start microphone capture
 */
export async function startMicrophone() {
  try {
    console.log('Starting microphone...');
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true
      }
    });
    
    const audioTrack = stream.getAudioTracks()[0];
    
    // Create LiveKit LocalAudioTrack
    const lkAudioTrack = new LocalAudioTrack(audioTrack);
    
    localAudioTrack.set(lkAudioTrack);
    isAudioEnabled.set(true);
    isAudioMuted.set(false);
    
    console.log('Microphone started successfully');
    
  } catch (error) {
    console.error('Error starting microphone:', error);
    status.set(`❌ Mikrofon-Fehler: ${error.message}`);
    throw error;
  }
}

/**
 * Stop microphone
 */
export async function stopMicrophone() {
  const lkAudioTrack = get(localAudioTrack);
  
  if (lkAudioTrack) {
    lkAudioTrack.stop();
    localAudioTrack.set(null);
  }
  
  isAudioEnabled.set(false);
  isAudioMuted.set(true);
  
  console.log('Microphone stopped');
}

/**
 * Toggle microphone mute
 */
export async function toggleMicrophone() {
  const lkAudioTrack = get(localAudioTrack);
  
  if (!lkAudioTrack) {
    await startMicrophone();
    return;
  }
  
  const isMuted = get(isAudioMuted);
  
  if (isMuted) {
    lkAudioTrack.unmute();
    isAudioMuted.set(false);
    console.log('Microphone unmuted');
  } else {
    lkAudioTrack.mute();
    isAudioMuted.set(true);
    console.log('Microphone muted');
  }
}

/**
 * Publish audio track to room
 */
export async function publishAudioTrack(currentRoom) {
  const lkAudioTrack = get(localAudioTrack);
  
  if (!currentRoom || !lkAudioTrack) {
    throw new Error('Room or audio track not available');
  }
  
  try {
    await currentRoom.localParticipant.publishTrack(lkAudioTrack, {
      name: 'microphone'
    });
    
    console.log('Audio track published successfully');
    
  } catch (error) {
    console.error('Error publishing audio track:', error);
    throw error;
  }
}

/**
 * Unpublish audio track from room
 */
export async function unpublishAudioTrack(currentRoom) {
  if (!currentRoom) return;
  
  try {
    const lkAudioTrack = get(localAudioTrack);
    if (lkAudioTrack) {
      await currentRoom.localParticipant.unpublishTrack(lkAudioTrack);
      console.log('Audio track unpublished');
    }
  } catch (error) {
    console.error('Error unpublishing audio track:', error);
  }
}
