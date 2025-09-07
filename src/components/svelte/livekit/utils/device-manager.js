/**
 * LiveKit Device Manager
 * Handles device enumeration and selection for cameras and microphones
 */

import { writable } from 'svelte/store';

// Use globalThis for better compatibility
const navigator = globalThis.navigator;

// Device stores
export const availableVideoDevices = writable([]);
export const availableAudioDevices = writable([]);
export const selectedVideoDevice = writable(null);
export const selectedAudioDevice = writable(null);
export const hasPermissions = writable(false);

/**
 * Request media permissions to enable device enumeration
 */
export async function requestMediaPermissions() {
  try {
    console.log('Requesting media permissions for device enumeration...');
    
    // Request both video and audio permissions
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });
    
    // Stop the stream immediately as we only needed permissions
    stream.getTracks().forEach(track => track.stop());
    
    hasPermissions.set(true);
    console.log('Media permissions granted');
    
    return true;
  } catch (error) {
    console.error('Error requesting media permissions:', error);
    hasPermissions.set(false);
    throw error;
  }
}

/**
 * Enumerate all available media devices
 */
export async function enumerateDevices() {
  try {
    console.log('Enumerating available media devices...');
    
    const devices = await navigator.mediaDevices.enumerateDevices();
    
    // Filter devices by type
    const videoDevices = devices.filter(device => device.kind === 'videoinput');
    const audioDevices = devices.filter(device => device.kind === 'audioinput');
    
    console.log(`Found ${videoDevices.length} camera(s) and ${audioDevices.length} microphone(s)`);
    
    // Update stores
    availableVideoDevices.set(videoDevices);
    availableAudioDevices.set(audioDevices);
    
    // Set default devices if none selected
    selectedVideoDevice.update(current => {
      if (!current && videoDevices.length > 0) {
        return videoDevices[0];
      }
      return current;
    });
    
    selectedAudioDevice.update(current => {
      if (!current && audioDevices.length > 0) {
        return audioDevices[0];
      }
      return current;
    });
    
    return { videoDevices, audioDevices };
  } catch (error) {
    console.error('Error enumerating devices:', error);
    throw error;
  }
}

/**
 * Initialize device enumeration (request permissions and enumerate)
 */
export async function initializeDevices() {
  try {
    await requestMediaPermissions();
    await enumerateDevices();
    
    // Listen for device changes
    navigator.mediaDevices.addEventListener('devicechange', async () => {
      console.log('Device change detected, re-enumerating...');
      await enumerateDevices();
    });
    
    console.log('Device manager initialized successfully');
  } catch (error) {
    console.error('Error initializing device manager:', error);
    throw error;
  }
}

/**
 * Get device label or fallback name
 */
export function getDeviceLabel(device, index, deviceType = 'device') {
  if (device.label && device.label.trim() !== '') {
    return device.label;
  }
  
  // Fallback names when permissions aren't granted
  return `${deviceType} ${index + 1}`;
}

/**
 * Select video device
 */
export function selectVideoDevice(device) {
  console.log('Selecting video device:', device.label || device.deviceId);
  selectedVideoDevice.set(device);
}

/**
 * Select audio device
 */
export function selectAudioDevice(device) {
  console.log('Selecting audio device:', device.label || device.deviceId);
  selectedAudioDevice.set(device);
}

/**
 * Get current selected video device constraints
 */
export function getVideoConstraints(customConstraints = {}) {
  return (device) => {
    if (!device || !device.deviceId) {
      return {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 },
        ...customConstraints
      };
    }
    
    return {
      deviceId: { exact: device.deviceId },
      width: { ideal: 1280 },
      height: { ideal: 720 },
      frameRate: { ideal: 30 },
      ...customConstraints
    };
  };
}

/**
 * Get current selected audio device constraints
 */
export function getAudioConstraints(customConstraints = {}) {
  return (device) => {
    if (!device || !device.deviceId) {
      return {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        ...customConstraints
      };
    }
    
    return {
      deviceId: { exact: device.deviceId },
      echoCancellation: true,
      noiseSuppression: true,
      autoGainControl: true,
      ...customConstraints
    };
  };
}