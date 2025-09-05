<script>
  import { onMount, onDestroy } from 'svelte';
  import { Room, RoomEvent, createLocalVideoTrack, ConnectionState } from 'livekit-client';

  export let isStreamer = false;

  let room = null;
  let localVideoTrack = null;
  let isConnected = false;
  let status = 'Bereit';
  let participantName = '';
  let hasActiveStream = false;
  let isConnecting = false;
  let participantCount = 0;
  let participants = [];
  let showNewParticipantBlink = false;
  let showCountBlink = false;

  // DOM elements
  let localVideo;
  let remoteVideos;
  let noCameraDiv;
  let noStreamDiv;

  onMount(() => {
    if (!isStreamer) {
      // Auto-connect für Viewer
      participantName = `Viewer-${Date.now()}`;
      connectAsViewer();
    }
  });

  onDestroy(() => {
    if (room) {
      room.disconnect();
    }
  });

  async function connectAsViewer() {
    if (isStreamer || isConnecting) return;
    
    isConnecting = true;
    status = '🔍 Verbinde zum Stream-Room...';

    try {
      await connectToRoom();
      status = '✅ Verbunden! Warte auf Streams...';
    } catch (error) {
      console.error('Viewer connection failed:', error);
      status = '❌ Verbindung fehlgeschlagen';
    } finally {
      isConnecting = false;
    }
  }

  async function startStream() {
    if (!participantName.trim()) return;
    
    isConnecting = true;
    await connectToRoom();
    
    if (isStreamer && isConnected) {
      await setupCamera();
    }
    isConnecting = false;
  }

  async function connectToRoom() {
    if (isConnecting && room) return; // Verhindere mehrfache Connects

    try {
      status = 'Verbinde mit LiveKit...';

      // Get token from server
      const response = await fetch(`/api/livekit/token?name=${encodeURIComponent(participantName)}&streamer=${isStreamer}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to get token');
      }

      // Create room with auto-reconnect settings
      room = new Room({
        // LiveKit's eingebautes Auto-Reconnect
        reconnectPolicy: {
          nextRetryDelayInMs: (context) => {
            console.log(`Reconnect attempt ${context.retryCount}`);
            return Math.min(1000 * Math.pow(2, context.retryCount), 30000); // Exponential backoff max 30s
          },
          maxRetryCount: Infinity // Endlos versuchen
        },
        disconnectOnPageLeave: true
      });
      
      // Connection State Events
      room.on(RoomEvent.Connected, () => {
        console.log('Connected to room');
        isConnected = true;
        status = isStreamer ? '✅ Verbunden!' : '✅ Verbunden! Warte auf Streams...';
        
        updateParticipantsList();
        
        if (!isStreamer) {
          checkForActiveStreams();
        }
      });

      room.on(RoomEvent.Disconnected, (reason) => {
        console.log('Disconnected from room:', reason);
        isConnected = false;
        hasActiveStream = false;
        
        if (reason === 'user-initiated') {
          status = isStreamer ? 'Stream beendet' : 'Verbindung getrennt';
        } else {
          status = '🔄 Reconnecting...';
        }
        
        // UI cleanup - alle Video-Elemente entfernen
        if (remoteVideos) {
          const videoElements = remoteVideos.querySelectorAll('video');
          videoElements.forEach(video => {
            video.srcObject = null;
            video.remove();
          });
          remoteVideos.innerHTML = '';
          
          if (noStreamDiv) {
            noStreamDiv.style.display = 'flex';
          }
        }
      });

      room.on(RoomEvent.Reconnecting, () => {
        console.log('Reconnecting...');
        status = '🔄 Reconnecting...';
        isConnected = false;
      });

      room.on(RoomEvent.Reconnected, () => {
        console.log('Reconnected successfully');
        isConnected = true;
        status = isStreamer ? '✅ Reconnected!' : '✅ Reconnected! Warte auf Streams...';
        
        if (!isStreamer) {
          checkForActiveStreams();
        }
      });

      // Track Events für Viewer
      if (!isStreamer) {
        room.on(RoomEvent.TrackSubscribed, (track, publication, participant) => {
          if (track.kind === 'video') {
            handleVideoTrackSubscribed(track, participant);
          }
        });

        room.on(RoomEvent.TrackUnsubscribed, (track, publication, participant) => {
          if (track.kind === 'video') {
            handleVideoTrackUnsubscribed(track, participant);
          }
        });

        room.on(RoomEvent.ParticipantConnected, (participant) => {
          console.log('Participant connected:', participant.identity);
          updateParticipantsList();
          // Warte kurz bis Tracks verfügbar sind
          setTimeout(checkForActiveStreams, 1000);
        });

        room.on(RoomEvent.ParticipantDisconnected, (participant) => {
          console.log('Participant disconnected:', participant.identity);
          updateParticipantsList();
          setTimeout(checkForActiveStreams, 500);
        });
      }

      // Connect to room
      await room.connect(data.wsUrl, data.token);

    } catch (error) {
      console.error('Error connecting to room:', error);
      status = `❌ Fehler: ${error.message}`;
      isConnected = false;
      throw error;
    }
  }

  function updateParticipantsList() {
    if (!room) {
      participantCount = 0;
      participants = [];
      return;
    }

    // Alle Teilnehmer sammeln (inkl. local participant)
    const allParticipants = [
      room.localParticipant,
      ...Array.from(room.remoteParticipants.values())
    ].filter(p => p && p.identity);

    participants = allParticipants.map(p => ({
      identity: p.identity,
      isLocal: p === room.localParticipant,
      hasVideo: Array.from(p.videoTrackPublications.values()).some(pub => pub.isSubscribed || pub.track),
      hasAudio: Array.from(p.audioTrackPublications.values()).some(pub => pub.isSubscribed || pub.track)
    }));

    const newCount = participants.length;
    const oldCount = participantCount;
    
    // Blink-Effekt bei Änderung der Teilnehmerzahl
    if (newCount !== oldCount && oldCount > 0) {
      showCountBlink = true;
      showNewParticipantBlink = true;
      
      setTimeout(() => {
        showCountBlink = false;
        showNewParticipantBlink = false;
      }, 800);
    }
    
    participantCount = newCount;

    console.log('Participants updated:', participants);
  }

  function checkForActiveStreams() {
    if (!room || isStreamer) return;
    
    console.log('Checking for active streams...');
    const participants = Array.from(room.remoteParticipants.values());
    console.log('Remote participants:', participants.map(p => p.identity));
    
    const activeVideoTracks = participants
      .flatMap(p => Array.from(p.videoTrackPublications.values()))
      .filter(pub => pub.isSubscribed && pub.track);
    
    console.log('Active video tracks:', activeVideoTracks.length);
    hasActiveStream = activeVideoTracks.length > 0;
    
    if (hasActiveStream) {
      status = '📹 Live Stream aktiv';
      if (noStreamDiv) {
        noStreamDiv.style.display = 'none';
      }
      
      // Sicherstellen, dass Video-Elemente vorhanden sind
      if (remoteVideos && remoteVideos.children.length === 0) {
        console.log('No video elements found, but tracks active - reattaching...');
        activeVideoTracks.forEach(pub => {
          if (pub.track) {
            handleVideoTrackSubscribed(pub.track, pub.track.participant);
          }
        });
      }
    } else {
      status = '⏳ Warte auf Stream...';
      if (noStreamDiv) {
        noStreamDiv.style.display = 'flex';
      }
      
      // Alle Video-Elemente entfernen wenn kein aktiver Stream
      if (remoteVideos) {
        remoteVideos.innerHTML = '';
      }
    }
  }

  function handleVideoTrackSubscribed(track, participant) {
    console.log('Video track subscribed from:', participant.identity);
    
    // Erst alle alten Video-Elemente entfernen
    if (remoteVideos) {
      remoteVideos.innerHTML = '';
    }
    
    // Neues Video-Element erstellen und anhängen
    const videoElement = track.attach();
    videoElement.className = 'w-full h-full object-cover rounded-lg';
    videoElement.autoplay = true;
    videoElement.playsInline = true;
    
    if (remoteVideos) {
      remoteVideos.appendChild(videoElement);
      noStreamDiv.style.display = 'none';
      
      // Force video to play (für manche Browser)
      setTimeout(() => {
        videoElement.play().catch(e => console.log('Video play error:', e));
      }, 100);
    }
    
    hasActiveStream = true;
    status = `📹 Stream von ${participant.identity} aktiv`;
  }

  function handleVideoTrackUnsubscribed(track, participant) {
    console.log('Video track unsubscribed from:', participant.identity);
    
    // Track detachen (entfernt alle Video-Elemente dieses Tracks)
    const detachedElements = track.detach();
    console.log('Detached elements:', detachedElements.length);
    
    // Explizit alle Video-Elemente aus dem Container entfernen
    if (remoteVideos) {
      const videoElements = remoteVideos.querySelectorAll('video');
      videoElements.forEach(video => {
        video.srcObject = null; // Stream freigeben
        video.remove(); // Element entfernen
      });
    }
    
    // Status nach kurzer Verzögerung prüfen
    setTimeout(() => {
      checkForActiveStreams();
    }, 500);
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

  function manualDisconnect() {
    if (room) {
      room.disconnect();
      room = null;
    }
    
    handleDisconnection();
  }

  function handleDisconnection() {
    isConnected = false;
    hasActiveStream = false;
    participantCount = 0;
    participants = [];
    lastParticipantCount = 0;
    status = isStreamer ? 'Stream beendet' : 'Verbindung getrennt';
    
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
      {isStreamer ? 'Starte deinen Live-Stream' : 'Live-Streams werden automatisch angezeigt'}
    </p>
  </div>

  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 mb-6">
    {#if isStreamer}
      <!-- Streamer Controls -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Dein Name
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
          disabled={!participantName.trim()}
          class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          🔴 Stream starten
        </button>
      {:else}
        <button 
          on:click={stopStream}
          class="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
        >
          ⏹️ Stream beenden
        </button>
      {/if}
    {:else}
      <!-- Viewer Info -->
      <div class="text-center mb-4">
        <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Du schaust als: <span class="font-medium">{participantName}</span>
        </p>
        
        {#if isConnected}
          <button 
            on:click={manualDisconnect}
            class="text-sm bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-md transition-colors"
          >
            🚪 Viewer beenden
          </button>
        {/if}
      </div>
    {/if}

    <!-- Video Display -->
    <div class="mt-6">
      <div class="flex justify-between items-center mb-3">
        <h3 class="text-lg font-medium text-gray-900 dark:text-gray-100">
          {isStreamer ? 'Kamera-Vorschau' : 'Live Stream'}
        </h3>
        
        <!-- Participants Counter -->
        {#if isConnected && participantCount > 0}
          <div class="flex items-center space-x-2">
            <div class="flex items-center space-x-1 bg-gray-100 dark:bg-gray-700 px-3 py-1 rounded-full text-sm transition-all duration-200" class:ring-2={showCountBlink} class:ring-blue-400={showCountBlink} class:ring-opacity-60={showCountBlink}>
              <span class="text-gray-600 dark:text-gray-400">👥</span>
              
              <!-- Simple Counter mit Blink-Effekt -->
              <span 
                class="font-medium text-gray-900 dark:text-gray-100"
                class:text-green-600={showNewParticipantBlink}
                class:dark:text-green-400={showNewParticipantBlink}
              >
                {participantCount}
              </span>
              
              {#if hasActiveStream}
                <span class="w-2 h-2 bg-red-500 rounded-full animate-pulse ml-1"></span>
              {:else}
                <span class="w-2 h-2 bg-gray-400 rounded-full ml-1"></span>
              {/if}
            </div>
          </div>
        {/if}
      </div>
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

      <!-- Participants List (nur für Streamer) -->
      {#if isStreamer && isConnected && participants.length > 0}
        <div class="mt-4 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
          <h4 class="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 flex items-center">
            <span class="mr-2">👥</span>
            Teilnehmer ({participantCount})
            {#if showNewParticipantBlink}
              <span class="ml-2 text-green-600 dark:text-green-400 animate-pulse">+NEU</span>
            {/if}
          </h4>
          <div class="space-y-1">
            {#each participants as participant}
              <div class="flex items-center justify-between text-sm p-2 rounded bg-white dark:bg-gray-800">
                <div class="flex items-center space-x-2">
                  <span class="font-medium text-gray-900 dark:text-gray-100">
                    {participant.identity}
                  </span>
                  {#if participant.isLocal}
                    <span class="text-blue-600 dark:text-blue-400 text-xs">(Du)</span>
                  {/if}
                </div>
                <div class="flex items-center space-x-1">
                  {#if participant.hasVideo}
                    <span class="text-green-500" title="Video aktiv">📹</span>
                  {:else}
                    <span class="text-gray-400" title="Kein Video">📹</span>
                  {/if}
                  {#if participant.hasAudio}
                    <span class="text-green-500" title="Audio aktiv">🎤</span>
                  {:else}
                    <span class="text-gray-400" title="Kein Audio">🎤</span>
                  {/if}
                </div>
              </div>
            {/each}
          </div>
        </div>
      {/if}
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
        : 'Live-Streams werden automatisch erkannt und angezeigt. Bei Unterbrechungen wird automatisch neu verbunden.'
      }
    </p>
  </div>
</div>