import { createLocalVideoTrack } from 'livekit-client';
import { localVideoTrack, isStartingStream, status, hasActiveStream } from './livekit-store.js';
import { get } from 'svelte/store';

/**
 * Handles video track subscription for viewers
 */
export function handleVideoTrackSubscribed(track, participant, remoteVideos, noStreamDiv) {
  console.log(`Video track subscribed from ${participant.identity}`);
  
  const video = document.createElement('video');
  video.id = `video-${participant.sid}`;
  video.autoplay = true;
  video.playsInline = true;
  video.muted = false;
  video.controls = false;
  
  // Style the video element
  video.style.width = '100%';
  video.style.height = '100%';
  video.style.objectFit = 'contain';
  video.style.backgroundColor = 'black';
  video.style.borderRadius = '8px';
  
  track.attach(video);
  
  if (remoteVideos && noStreamDiv) {
    // Create container for this video
    const container = document.createElement('div');
    container.className = 'video-container';
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: 400px;
      margin-bottom: 16px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    `;
    
    // Add participant label
    const label = document.createElement('div');
    label.textContent = participant.identity;
    label.style.cssText = `
      position: absolute;
      bottom: 8px;
      left: 8px;
      background: rgba(0, 0, 0, 0.7);
      color: white;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 12px;
      z-index: 10;
    `;
    
    container.appendChild(video);
    container.appendChild(label);
    remoteVideos.appendChild(container);
    
    // Hide "no stream" message
    noStreamDiv.style.display = 'none';
    hasActiveStream.set(true);
  }
}

/**
 * Handles video track unsubscription for viewers
 */
export function handleVideoTrackUnsubscribed(track, participant, remoteVideos, noStreamDiv) {
  console.log(`Video track unsubscribed from ${participant.identity}`);
  
  const video = document.getElementById(`video-${participant.sid}`);
  if (video) {
    track.detach(video);
    const container = video.parentElement;
    if (container && container.className === 'video-container') {
      container.remove();
    } else {
      video.remove();
    }
  }
  
  if (remoteVideos && noStreamDiv) {
    // Check if there are any remaining video streams
    const remainingVideos = remoteVideos.querySelectorAll('video');
    if (remainingVideos.length === 0) {
      noStreamDiv.style.display = 'flex';
      hasActiveStream.set(false);
    }
  }
}

/**
 * Starts camera for streaming
 */
export async function startCamera(localVideo, noCameraDiv) {
  isStartingStream.set(true);
  status.set('🎥 Kamera wird gestartet...');
  
  try {
    const currentTrack = get(localVideoTrack);
    if (currentTrack) {
      currentTrack.stop();
    }
    
    const videoTrack = await createLocalVideoTrack({
      resolution: {
        width: 1280,
        height: 720,
        frameRate: 30
      }
    });
    
    localVideoTrack.set(videoTrack);
    
    if (localVideo) {
      videoTrack.attach(localVideo);
      localVideo.style.display = 'block';
      if (noCameraDiv) {
        noCameraDiv.style.display = 'none';
      }
    }
    
    status.set('✅ Kamera gestartet!');
    return videoTrack;
    
  } catch (error) {
    console.error('Error starting camera:', error);
    status.set(`❌ Kamera-Fehler: ${error.message}`);
    throw error;
  } finally {
    isStartingStream.set(false);
  }
}

/**
 * Stops camera stream (only for streamer)
 */
export function stopCamera(localVideo, noCameraDiv) {
  const currentTrack = get(localVideoTrack);
  
  if (currentTrack) {
    currentTrack.stop();
    localVideoTrack.set(null);
  }
  
  if (localVideo) {
    // For streamer: stop all tracks and clear video element
    if (localVideo.srcObject) {
      const tracks = localVideo.srcObject.getTracks();
      tracks.forEach(track => track.stop());
    }
    
    localVideo.srcObject = null;
    localVideo.pause();
    localVideo.style.display = 'none';
    localVideo.load(); // Reset the video element
  }
  
  if (noCameraDiv) {
    noCameraDiv.style.display = 'flex';
  }
  
  status.set('📹 Kamera gestoppt');
}

/**
 * Publishes video track to room
 */
export async function publishVideoTrack(currentRoom) {
  const videoTrack = get(localVideoTrack);
  
  if (!currentRoom || !videoTrack) {
    throw new Error('Room or video track not available');
  }
  
  try {
    await currentRoom.localParticipant.publishTrack(videoTrack, {
      name: 'camera',
      simulcast: true
    });
    
    console.log('Video track published successfully');
    status.set('🔴 LIVE - Stream läuft!');
    hasActiveStream.set(true);
    
  } catch (error) {
    console.error('Error publishing video track:', error);
    status.set(`❌ Stream-Fehler: ${error.message}`);
    throw error;
  }
}

/**
 * Unpublishes video track from room but keeps local preview
 */
export async function unpublishVideoTrack(currentRoom) {
  if (!currentRoom) return;
  
  try {
    const videoTrack = get(localVideoTrack);
    if (videoTrack) {
      await currentRoom.localParticipant.unpublishTrack(videoTrack);
      console.log('Video track unpublished');
    }
    
    hasActiveStream.set(false);
    status.set('⏹️ Stream gestoppt');
    
  } catch (error) {
    console.error('Error unpublishing video track:', error);
    status.set(`❌ Stop-Fehler: ${error.message}`);
  }
}

/**
 * Recreates local video preview after stopping stream
 */
export async function recreateLocalPreview(localVideo) {
  if (!localVideo) return;
  
  try {
    // Get fresh camera stream for local preview
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: false
    });
    
    // Apply the fresh stream to local video element
    localVideo.srcObject = stream;
    localVideo.style.display = 'block';
    
    console.log('Local video preview recreated');
    
  } catch (error) {
    console.error('Error recreating local preview:', error);
  }
}
