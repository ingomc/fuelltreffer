/**
 * LiveKit Audio Manager
 * Handles microphone controls and audio track publishing
 */

import { writable, get } from 'svelte/store';
import { LocalAudioTrack } from 'livekit-client';
import { status } from './livekit-store.js';
import { selectedAudioDevice, getAudioConstraints } from './device-manager.js';

// Use globalThis for better compatibility
const navigator = globalThis.navigator;

// Audio state stores
export const localAudioTrack = writable(null);
export const isAudioEnabled = writable(false);
export const isAudioMuted = writable(true);

/**
 * Start microphone capture
 */
export async function startMicrophone(customConstraints = {}) {
  try {
    const currentDevice = get(selectedAudioDevice);
    const getConstraints = getAudioConstraints(customConstraints);
    const audioConstraints = getConstraints(currentDevice);
    
    console.log('Starting microphone with device:', currentDevice?.label || 'default');
    console.log('Audio constraints:', audioConstraints);
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints
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
 * Switch to a different audio device during streaming
 */
export async function switchAudioDevice(newDevice) {
  console.log('Switching audio device to:', newDevice?.label || 'default');
  
  const currentTrack = get(localAudioTrack);
  if (!currentTrack) {
    console.warn('No active audio track to switch');
    return;
  }
  
  try {
    // Update the selected device
    selectedAudioDevice.set(newDevice);
    
    // Create new audio stream with the selected device
    const getConstraints = getAudioConstraints();
    const audioConstraints = getConstraints(newDevice);
    
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: audioConstraints
    });
    
    const newAudioTrack = stream.getAudioTracks()[0];
    
    if (newAudioTrack) {
      // Replace the track in the existing LiveKit track
      await currentTrack.replaceTrack(newAudioTrack);
      
      console.log('Audio device switched successfully');
      status.set(`✅ Mikrofon gewechselt zu: ${newDevice?.label || 'Standard'}`);
      
      // The old track is automatically stopped by replaceTrack
    }
    
  } catch (error) {
    console.error('Error switching audio device:', error);
    status.set(`❌ Mikrofon-Wechsel fehlgeschlagen: ${error.message}`);
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
