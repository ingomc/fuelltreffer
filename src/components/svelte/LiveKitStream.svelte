<script>
  import { onMount } from 'svelte';
  import { Room, RoomEvent, createLocalVideoTrack } from 'livekit-client';

  export let isStreamer = false;

  let room = null;
  let localVideoTrack = null;
  let isConnected = false;
  let status = 'Bereit';
  let participantName = '';

  // DOM elements
  let localVideo;
  let remoteVideos;
  let noCameraDiv;
  let noStreamDiv;

  async function startStream() {
    if (!participantName.trim()) return;

    try {
      status = 'Verbinde mit LiveKit...';
      
      // Get token from server
      const response = await fetch(`/api/livekit/token?name=${encodeURIComponent(participantName)}&streamer=${isStreamer}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get token');
      }

      // Create and connect room
      room = new Room();
      
      room.on(RoomEvent.Connected, () => {
        status = '✅ Verbunden!';
        isConnected = true;
      });

      room.on(RoomEvent.Disconnected, () => {
        handleDisconnection();
      });

      if (!isStreamer) {
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === 'video') {
            const videoElement = track.attach();
            videoElement.className = 'w-full h-full object-cover rounded-lg';
            remoteVideos.appendChild(videoElement);
            noStreamDiv.style.display = 'none';
            status = `📹 Stream von ${participant.identity} aktiv`;
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          track.detach();
          const videoTracks = Array.from(room.remoteParticipants.values())
            .flatMap(p => Array.from(p.videoTrackPublications.values()))
            .filter(pub => pub.isSubscribed);
          
          if (videoTracks.length === 0) {
            noStreamDiv.style.display = 'flex';
            status = '⏹️ Stream beendet';
          }
        });
      }

      await room.connect(data.wsUrl, data.token);

      if (isStreamer) {
        await setupCamera();
      }

    } catch (error) {
      console.error('Error:', error);
      status = `❌ Fehler: ${error.message}`;
    }
  }

  async function setupCamera() {
    try {
      localVideoTrack = await createLocalVideoTrack();
      localVideoTrack.attach(localVideo);
      noCameraDiv.style.display = 'none';
      localVideo.style.display = 'block';
      await room.localParticipant.publishTrack(localVideoTrack);
      status = '🔴 Stream läuft...';
    } catch (error) {
      console.error('Camera error:', error);
      status = '⚠️ Kamera-Zugriff fehlgeschlagen';
    }
  }

  function stopStream() {
    if (localVideoTrack) {
      localVideoTrack.detach();
      localVideoTrack.stop();
      localVideoTrack = null;
    }

    if (room) {
      room.disconnect();
      room = null;
    }

    handleDisconnection();
  }

  function handleDisconnection() {
    isConnected = false;
    status = isStreamer ? 'Stream beendet' : 'Nicht verbunden';
    
    if (localVideo) {
      localVideo.style.display = 'none';
      noCameraDiv.style.display = 'flex';
    }
    
    if (remoteVideos) {
      remoteVideos.innerHTML = '';
      noStreamDiv.style.display = 'flex';
    }
  }
</script>

<div class="max-w-4xl mx-auto px-4 py-8">
  <div class="text-center mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
      {isStreamer ? '📹 Live Stream' : '👀 Live Stream Viewer'}
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      {isStreamer ? 'Starte deinen Live-Stream' : 'Verfolge die Live-Streams'}
    </p>
  </div>

  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
    <!-- Name Input -->
    <div class="mb-4">
      <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        {isStreamer ? 'Dein Name' : 'Dein Name (optional)'}
      </label>
      <input 
        bind:value={participantName}
        type="text" 
        placeholder="Gib deinen Namen ein..."
        disabled={isConnected}
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 dark:disabled:bg-gray-600"
      />
    </div>

    <!-- Control Buttons -->
    {#if !isConnected}
      <button 
        on:click={startStream}
        disabled={isStreamer && !participantName.trim()}
        class="w-full bg-{isStreamer ? 'green' : 'blue'}-600 hover:bg-{isStreamer ? 'green' : 'blue'}-700 text-white px-6 py-3 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
      >
        {isStreamer ? '🔴 Stream starten' : '🔗 Stream beitreten'}
      </button>
    {:else}
      <button 
        on:click={stopStream}
        class="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
      >
        {isStreamer ? '⏹️ Stream beenden' : '👋 Stream verlassen'}
      </button>
    {/if}

    <!-- Video Display -->
    <div class="mt-6">
      <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100 mb-3">
        {isStreamer ? 'Kamera-Vorschau' : 'Live Stream'}
      </h3>
      <div class="relative bg-gray-900 rounded-lg overflow-hidden aspect-video">
        {#if isStreamer}
          <video bind:this={localVideo} autoplay muted playsinline class="w-full h-full object-cover" style="display: none;"></video>
          <div bind:this={noCameraDiv} class="absolute inset-0 flex items-center justify-center text-white text-lg">
            📷 Kamera nicht verfügbar
          </div>
        {:else}
          <div bind:this={remoteVideos} class="w-full h-full"></div>
          <div bind:this={noStreamDiv} class="absolute inset-0 flex items-center justify-center text-white text-lg">
            📺 Kein aktiver Stream verfügbar
          </div>
        {/if}
      </div>
    </div>

    <!-- Status -->
    <div class="mt-4 text-sm text-gray-600 dark:text-gray-400">
      Status: {status}
    </div>
  </div>

  <!-- Info Box -->
  <div class="bg-{isStreamer ? 'blue' : 'green'}-50 dark:bg-{isStreamer ? 'blue' : 'green'}-900/20 border border-{isStreamer ? 'blue' : 'green'}-200 dark:border-{isStreamer ? 'blue' : 'green'}-800 rounded-lg p-4">
    <h3 class="text-sm font-medium text-{isStreamer ? 'blue' : 'green'}-800 dark:text-{isStreamer ? 'blue' : 'green'}-200 mb-2">ℹ️ Info</h3>
    <p class="text-sm text-{isStreamer ? 'blue' : 'green'}-700 dark:text-{isStreamer ? 'blue' : 'green'}-300">
      {isStreamer 
        ? 'Sobald du streamst, können andere auf der Viewer-Seite deinen Stream sehen.'
        : 'Hier siehst du Live-Streams von der Streamer-Seite. Du brauchst dich nicht anzumelden.'
      }
    </p>
  </div>
</div>