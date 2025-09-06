import { LocalVideoTrack } from 'livekit-client';
import { localVideoTrack, isStartingStream, status, hasActiveStream } from './livekit-store.js';
import { get } from 'svelte/store';

// Use globalThis for better compatibility
const navigator = globalThis.navigator;
const setTimeout = globalThis.setTimeout;

/**
 * Handles incoming video track from remote participant
 */
export function handleVideoTrackSubscribed(track, participant, remoteVideos, noStreamDiv, screenShareVideo) {
  console.log(`🎬 VIDEO TRACK SUBSCRIBED: ${participant.identity}`);
  console.log(`Video track subscribed from ${participant.identity}, name: ${track.name}, source: ${track.source}`);
  console.log(`remoteVideos element:`, remoteVideos);
  console.log(`noStreamDiv element:`, noStreamDiv);
  
  // Check if this is a screen share track - LiveKit uses different naming
  const isScreenShare = track.name === 'screen_share' || 
                        track.source === 'screen_share' || 
                        track.name === 'screen' ||
                        participant.isScreenShareEnabled;
  
  if (isScreenShare && screenShareVideo) {
    // Handle screen share separately
    console.log('🖥️ Attaching SCREEN SHARE track to video element');
    console.log('Screen share video element:', screenShareVideo);
    console.log('Track details:', { 
      name: track.name, 
      kind: track.kind, 
      source: track.source, 
      mediaStreamTrack: track.mediaStreamTrack,
      isRemote: !track.isLocal 
    });
    
    try {
      // Clear any existing video first
      screenShareVideo.srcObject = null;
      
      // For RemoteVideoTrack, we MUST use track.attach(element) according to LiveKit docs
      // This is especially important for adaptive streams
      console.log('📌 Using LiveKit RemoteVideoTrack.attach() method');
      const result = track.attach(screenShareVideo);
      console.log('✅ LiveKit attach result:', result);
      
      // Make sure the video is visible and properly configured
      screenShareVideo.style.display = 'block';
      screenShareVideo.style.width = '100%';
      screenShareVideo.style.height = '100%';
      screenShareVideo.style.objectFit = 'contain';
      screenShareVideo.style.backgroundColor = '#000';
      screenShareVideo.autoplay = true;
      screenShareVideo.playsInline = true;
      screenShareVideo.muted = false; // Screen share should have audio
      screenShareVideo.controls = true;
      
      // Function to set screen share aspect ratio
      const setScreenShareAspectRatio = () => {
        const videoTrack = track.mediaStreamTrack;
        if (videoTrack && videoTrack.getSettings) {
          const settings = videoTrack.getSettings();
          if (settings.width && settings.height) {
            const aspectRatio = settings.width / settings.height;
            console.log(`📐 Screen share dimensions: ${settings.width}x${settings.height}, aspect ratio: ${aspectRatio.toFixed(2)}`);
            
            // Get the screen share container (parent of screenShareVideo)
            const container = screenShareVideo.parentElement;
            if (container) {
              // Calculate height based on container width and aspect ratio
              const containerWidth = container.offsetWidth || 800; // fallback for screen shares
              const calculatedHeight = containerWidth / aspectRatio;
              
              console.log(`📦 Screen share container width: ${containerWidth}px, calculated height: ${calculatedHeight.toFixed(0)}px`);
              
              // Set container aspect ratio
              container.style.aspectRatio = `${aspectRatio}`;
              container.style.height = `${Math.min(calculatedHeight, window.innerHeight * 0.7)}px`; // Max 70vh
            }
          }
        }
      };
      
      // Set aspect ratio when metadata is loaded
      screenShareVideo.addEventListener('loadedmetadata', () => {
        console.log('📹 Screen share metadata loaded, setting aspect ratio...');
        setScreenShareAspectRatio();
      });
      
      // Also try immediately
      setTimeout(setScreenShareAspectRatio, 100);
      
      // Force a play attempt after a small delay to ensure srcObject is set
      setTimeout(() => {
        console.log('🎬 Attempting to play screen share video');
        console.log('Video readyState:', screenShareVideo.readyState);
        console.log('Video srcObject after attach:', screenShareVideo.srcObject);
        
        screenShareVideo.play().catch(error => {
          console.warn('Could not auto-play screen share video:', error);
        });
      }, 100);
      
      console.log('✅ Screen share video attached and configured');
      
    } catch (error) {
      console.error('❌ Error attaching screen share video:', error);
    }
    
    return;
  }
  
  // Handle regular camera video
  const video = document.createElement('video');
  video.id = `video-${participant.sid}`;
  video.autoplay = true;
  video.playsInline = true;
  video.muted = false;
  video.controls = true;
  
  // Style the video element
  video.style.width = '100%';
  video.style.height = 'auto';
  video.style.objectFit = 'contain';
  video.style.backgroundColor = 'black';
  video.style.borderRadius = '8px';
  
  track.attach(video);
  
  if (remoteVideos && noStreamDiv) {
    console.log(`📺 Creating remote video element for ${participant.identity}`);
    // Create container for this video
    const container = document.createElement('div');
    container.className = 'video-container';
    container.style.cssText = `
      position: relative;
      width: 100%;
      height: auto;
      min-height: 200px;
      margin-bottom: 16px;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
      resize: both;
      border: 2px solid transparent;
      transition: border-color 0.2s ease;
    `;
    
    // Function to calculate and set proper aspect ratio
    const setVideoAspectRatio = () => {
      const videoTrack = track.mediaStreamTrack;
      if (videoTrack && videoTrack.getSettings) {
        const settings = videoTrack.getSettings();
        if (settings.width && settings.height) {
          const aspectRatio = settings.width / settings.height;
          console.log(`📐 Video dimensions: ${settings.width}x${settings.height}, aspect ratio: ${aspectRatio.toFixed(2)}`);
          
          // Calculate container height based on current width and aspect ratio  
          const containerWidth = container.offsetWidth || 400; // fallback width
          const calculatedHeight = containerWidth / aspectRatio;
          
          console.log(`📦 Container width: ${containerWidth}px, calculated height: ${calculatedHeight.toFixed(0)}px`);
          
          // Set the container dimensions to maintain aspect ratio
          container.style.height = `${calculatedHeight}px`;
          container.style.aspectRatio = `${aspectRatio}`;
          
          // Ensure video fills container properly
          video.style.width = '100%';
          video.style.height = '100%';
          video.style.objectFit = 'cover'; // Cover for better fit
        }
      }
    };
    
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
    
    // Set initial aspect ratio when video metadata is loaded
    video.addEventListener('loadedmetadata', () => {
      console.log('📹 Video metadata loaded, setting aspect ratio...');
      setVideoAspectRatio();
    });
    
    // Also try to set it immediately in case metadata is already available
    setTimeout(setVideoAspectRatio, 100);
    
    // Add hover effect for resizable container
    container.addEventListener('mouseenter', () => {
      container.style.borderColor = 'rgba(59, 130, 246, 0.5)';
    });
    
    container.addEventListener('mouseleave', () => {
      container.style.borderColor = 'transparent';
    });
    
    // Hide "no stream" message since we have a video
    noStreamDiv.style.display = 'none';
    
    console.log('Remote video element created and attached');
    hasActiveStream.set(true);
  }
}

/**
 * Handles video track unsubscribed
 */
export function handleVideoTrackUnsubscribed(track, participant, remoteVideos) {
  console.log(`Video track unsubscribed from ${participant.identity}`);
  
  // Check if this is a screen share track - LiveKit uses different naming
  const isScreenShare = track.name === 'screen_share' || 
                        track.source === 'screen_share' || 
                        track.name === 'screen';
  
  if (isScreenShare) {
    // Screen share track detached
    console.log('🖥️ Screen share track detached');
    return;
  }
  
  const video = document.getElementById(`video-${participant.sid}`);
  if (video && video.parentElement) {
    video.parentElement.remove();
    console.log('Remote video element removed');
  }
  
  // Check if there are any remaining videos
  if (remoteVideos && remoteVideos.children.length === 0) {
    hasActiveStream.set(false);
  }
}

/**
 * Creates a local video track from camera
 */
export async function createVideoTrack() {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: true // Enable audio for full streaming
    });
    
    const videoTrack = stream.getVideoTracks()[0];
    
    if (videoTrack) {
      const lkTrack = new LocalVideoTrack(videoTrack);
      return lkTrack;
    }
    
  } catch (error) {
    console.error('Error creating video track:', error);
    throw error;
  }
}

/**
 * Starts the camera and creates local preview
 */
export async function startCamera(localVideo, noCameraDiv) {
  console.log('Starting camera...');
  isStartingStream.set(true);
  status.set('📹 Kamera startet...');
  
  try {
    const videoTrack = await createVideoTrack();
    localVideoTrack.set(videoTrack);
    
    // Apply track to local video element
    if (localVideo) {
      videoTrack.attach(localVideo);
      localVideo.style.display = 'block';
      
      // Set up aspect ratio for local video
      const setLocalVideoAspectRatio = () => {
        const mediaStreamTrack = videoTrack.mediaStreamTrack;
        if (mediaStreamTrack && mediaStreamTrack.getSettings) {
          const settings = mediaStreamTrack.getSettings();
          if (settings.width && settings.height) {
            const aspectRatio = settings.width / settings.height;
            console.log(`📐 Local video dimensions: ${settings.width}x${settings.height}, aspect ratio: ${aspectRatio.toFixed(2)}`);
            
            // Get the video container (parent of localVideo)
            const container = localVideo.parentElement;
            if (container && container.classList.contains('video-container')) {
              // Calculate height based on container width and aspect ratio
              const containerWidth = container.offsetWidth || 400;
              const calculatedHeight = containerWidth / aspectRatio;
              
              console.log(`📦 Local video container width: ${containerWidth}px, calculated height: ${calculatedHeight.toFixed(0)}px`);
              
              // Set container dimensions
              container.style.aspectRatio = `${aspectRatio}`;
              container.style.height = `${calculatedHeight}px`;
              
              // Make video fill container
              localVideo.style.width = '100%';
              localVideo.style.height = '100%';
              localVideo.style.objectFit = 'cover';
            }
          }
        }
      };
      
      // Set aspect ratio when metadata is loaded
      localVideo.addEventListener('loadedmetadata', () => {
        console.log('📹 Local video metadata loaded, setting aspect ratio...');
        setLocalVideoAspectRatio();
      });
      
      // Also try immediately
      setTimeout(setLocalVideoAspectRatio, 100);
    }
    
    // Hide "no camera" placeholder
    if (noCameraDiv) {
      noCameraDiv.style.display = 'none';
    }
    
    console.log('Camera started successfully');
    status.set('📹 Kamera bereit');
    
  } catch (error) {
    console.error('Error starting camera:', error);
    status.set(`❌ Kamera-Fehler: ${error.message}`);
    throw error;
  } finally {
    isStartingStream.set(false);
  }
}

/**
 * Stops the camera and cleans up
 */
export async function stopCamera(localVideo, noCameraDiv) {
  console.log('Stopping camera...');
  
  const videoTrack = get(localVideoTrack);
  if (videoTrack) {
    videoTrack.stop();
    localVideoTrack.set(null);
  }
  
  // Clean up video element
  if (localVideo) {
    localVideo.srcObject = null;
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
    // Publish both video and audio tracks from the camera stream
    const stream = videoTrack.mediaStream || videoTrack.getSettings?.().mediaStream;
    
    await currentRoom.localParticipant.publishTrack(videoTrack, {
      name: 'camera',
      simulcast: true
    });
    
    // Also publish audio track if available in the same stream
    if (stream) {
      const audioTracks = stream.getAudioTracks();
      if (audioTracks.length > 0) {
        await currentRoom.localParticipant.publishTrack(audioTracks[0], {
          name: 'microphone'
        });
        console.log('Audio track published with video');
      }
    }
    
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
    
    // Also unpublish microphone if it was published with video
    const micPublication = currentRoom.localParticipant.getTrackPublication('microphone');
    if (micPublication) {
      await currentRoom.localParticipant.unpublishTrack(micPublication.track);
      console.log('Microphone track unpublished');
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
      audio: true // Also enable audio for preview
    });
    
    // Apply the fresh stream to local video element
    localVideo.srcObject = stream;
    localVideo.style.display = 'block';
    
    console.log('Local video preview recreated');
    
  } catch (error) {
    console.error('Error recreating local preview:', error);
  }
}
