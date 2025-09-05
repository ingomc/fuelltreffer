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
  let isStartingStream = false;
  let participantCount = 0;
  let participants = [];
  let showNewParticipantBlink = false;
  let showCountBlink = false;
  let expandedParticipant = null;

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
    } else {
      // Auto-connect für Streamer (ohne Kamera)
      participantName = `Streamer-${Date.now()}`;
      connectAsStreamer();
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

  async function connectAsStreamer() {
    if (!isStreamer || isConnecting) return;
    
    isConnecting = true;
    status = '🔍 Verbinde zum Stream-Room...';

    try {
      await connectToRoom();
      status = '✅ Verbunden! Bereit zum Streamen.';
    } catch (error) {
      console.error('Streamer connection failed:', error);
      status = '❌ Verbindung fehlgeschlagen';
    } finally {
      isConnecting = false;
    }
  }

  async function startStream() {
    if (!participantName.trim()) return;
    
    if (!isConnected) {
      // Falls noch nicht verbunden, erst verbinden
      isConnecting = true;
      await connectToRoom();
      isConnecting = false;
      return; // Stopp hier - keine Kamera starten
    }
    
    if (isStreamer && isConnected) {
      isStartingStream = true;
      status = '📹 Starte Kamera...';
      try {
        await setupCamera();
        status = '✅ Stream läuft!';
      } catch (error) {
        console.error('Camera setup failed:', error);
        status = '❌ Kamera-Fehler';
      } finally {
        isStartingStream = false;
      }
    }
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
      // Alle verfügbaren Participant-Infos sammeln
      sid: p.sid,
      connectionState: p.connectionState,
      joinedAt: p.joinedAt,
      metadata: p.metadata,
      name: p.name,
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
      // Connection Quality
      connectionQuality: p.connectionQuality,
      // Permissions
      permissions: p.permissions ? {
        canPublish: p.permissions.canPublish,
        canSubscribe: p.permissions.canSubscribe,
        canPublishData: p.permissions.canPublishData,
        hidden: p.permissions.hidden,
        recorder: p.permissions.recorder
      } : null
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

  function toggleParticipantDetails(participantSid) {
    expandedParticipant = expandedParticipant === participantSid ? null : participantSid;
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
      hasActiveStream = true; // Stream ist jetzt aktiv
      status = '🔴 Stream läuft...';
    } catch (error) {
      console.error('Camera error:', error);
      status = '⚠️ Kamera-Zugriff fehlgeschlagen';
      throw error; // Error weiterwerfen für startStream
    }
  }

  function stopCamera() {
    if (localVideoTrack) {
      // Track vom Room entfernen
      room.localParticipant.unpublishTrack(localVideoTrack);
      
      // Track stoppen und UI cleanup
      localVideoTrack.detach();
      localVideoTrack.stop();
      localVideoTrack = null;
      
      // UI zurücksetzen
      if (localVideo) localVideo.style.display = 'none';
      if (noCameraDiv) noCameraDiv.style.display = 'flex';
    }

    hasActiveStream = false;
    status = '✅ Verbunden! Bereit zum Streamen.';
  }

  function leaveRoom() {
    // Erst Stream beenden falls aktiv
    if (hasActiveStream) {
      stopCamera();
    }

    // Dann Room verlassen
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
          disabled={!participantName.trim() || isConnecting}
          class="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {#if isConnecting}
            � Verbinde...
          {:else}
            🔗 Room beitreten
          {/if}
        </button>
      {:else if !hasActiveStream}
        <div class="space-y-2">
          <button 
            on:click={startStream}
            disabled={isStartingStream}
            class="w-full bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {#if isStartingStream}
              🔄 Starte Kamera...
            {:else}
              🔴 Kamera starten
            {/if}
          </button>
          <button 
            on:click={leaveRoom}
            class="w-full bg-red-600 hover:bg-red-700 text-white px-6 py-2 rounded-md font-medium transition-colors"
          >
            🚪 Room verlassen
          </button>
        </div>
      {:else if hasActiveStream}
        <div class="space-y-2">
          <button 
            on:click={stopCamera}
            class="w-full bg-orange-600 hover:bg-orange-700 text-white px-6 py-3 rounded-md font-medium transition-colors"
          >
            📹 Stream beenden
          </button>
          <p class="text-xs text-gray-600 dark:text-gray-400 text-center">
            Beende zuerst den Stream, um den Room zu verlassen
          </p>
        </div>
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
              <div class="border border-gray-200 dark:border-gray-600 rounded-lg overflow-hidden">
                <!-- Participant Header (klickbar) -->
                <button 
                  class="w-full flex items-center justify-between text-sm p-3 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  on:click={() => toggleParticipantDetails(participant.sid)}
                >
                  <div class="flex items-center space-x-2">
                    <span class="font-medium text-gray-900 dark:text-gray-100">
                      {participant.identity}
                    </span>
                    {#if participant.isLocal}
                      <span class="text-blue-600 dark:text-blue-400 text-xs">(Du)</span>
                    {/if}
                    <!-- Connection Quality Indicator -->
                    <span class="text-xs px-2 py-1 rounded-full" 
                          class:bg-green-100={participant.connectionQuality === 'excellent'}
                          class:text-green-800={participant.connectionQuality === 'excellent'}
                          class:bg-yellow-100={participant.connectionQuality === 'good'}
                          class:text-yellow-800={participant.connectionQuality === 'good'}
                          class:bg-red-100={participant.connectionQuality === 'poor'}
                          class:text-red-800={participant.connectionQuality === 'poor'}
                          class:bg-gray-100={!participant.connectionQuality}
                          class:text-gray-800={!participant.connectionQuality}>
                      {participant.connectionQuality || 'unknown'}
                    </span>
                  </div>
                  <div class="flex items-center space-x-2">
                    <!-- Status Icons -->
                    {#if participant.isCameraEnabled}
                      <span class="text-green-500" title="Video aktiv">📹</span>
                    {/if}
                    {#if participant.isMicrophoneEnabled}
                      <span class="text-green-500" title="Audio aktiv">🎤</span>
                    {/if}
                    {#if participant.isScreenShareEnabled}
                      <span class="text-blue-500" title="Screen Share aktiv">🖥️</span>
                    {/if}
                    <!-- Expand/Collapse Arrow -->
                    <span class="transform transition-transform" class:rotate-180={expandedParticipant === participant.sid}>
                      ▼
                    </span>
                  </div>
                </button>

                <!-- Expanded Details -->
                {#if expandedParticipant === participant.sid}
                  <div class="p-4 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-600">
                    <div class="space-y-3 text-xs text-gray-800 dark:text-gray-200">
                      <!-- Basic Info -->
                      <div class="grid grid-cols-2 gap-2">
                        <div><strong class="text-gray-900 dark:text-gray-100">SID:</strong> <span class="text-gray-700 dark:text-gray-300">{participant.sid}</span></div>
                        <div><strong class="text-gray-900 dark:text-gray-100">Name:</strong> <span class="text-gray-700 dark:text-gray-300">{participant.name || 'N/A'}</span></div>
                        <div><strong class="text-gray-900 dark:text-gray-100">Connection:</strong> <span class="text-gray-700 dark:text-gray-300">{participant.connectionState}</span></div>
                        <div><strong class="text-gray-900 dark:text-gray-100">Joined:</strong> <span class="text-gray-700 dark:text-gray-300">{participant.joinedAt ? new Date(participant.joinedAt).toLocaleTimeString() : 'N/A'}</span></div>
                      </div>

                      <!-- Metadata -->
                      {#if participant.metadata}
                        <div>
                          <strong class="text-gray-900 dark:text-gray-100">Metadata:</strong>
                          <pre class="mt-1 p-2 bg-gray-200 dark:bg-gray-800 rounded text-xs overflow-x-auto text-gray-800 dark:text-gray-200">{participant.metadata}</pre>
                        </div>
                      {/if}

                      <!-- Permissions -->
                      {#if participant.permissions}
                        <div>
                          <strong class="text-gray-900 dark:text-gray-100">Permissions:</strong>
                          <div class="mt-1 flex flex-wrap gap-1">
                            {#if participant.permissions.canPublish}
                              <span class="bg-green-100 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-1 rounded text-xs">Can Publish</span>
                            {/if}
                            {#if participant.permissions.canSubscribe}
                              <span class="bg-blue-100 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded text-xs">Can Subscribe</span>
                            {/if}
                            {#if participant.permissions.canPublishData}
                              <span class="bg-purple-100 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded text-xs">Can Publish Data</span>
                            {/if}
                            {#if participant.permissions.hidden}
                              <span class="bg-gray-200 dark:bg-gray-600 text-gray-800 dark:text-gray-200 px-2 py-1 rounded text-xs">Hidden</span>
                            {/if}
                            {#if participant.permissions.recorder}
                              <span class="bg-red-100 dark:bg-red-800 text-red-800 dark:text-red-200 px-2 py-1 rounded text-xs">Recorder</span>
                            {/if}
                          </div>
                        </div>
                      {/if}

                      <!-- Audio Tracks -->
                      {#if participant.audioTrackPublications.length > 0}
                        <div>
                          <strong class="text-gray-900 dark:text-gray-100">Audio Tracks:</strong>
                          {#each participant.audioTrackPublications as track}
                            <div class="mt-1 p-2 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                              <div class="flex flex-wrap gap-2 text-xs">
                                <span class="text-gray-800 dark:text-gray-200"><strong>SID:</strong> {track.trackSid}</span>
                                <span class="text-gray-800 dark:text-gray-200"><strong>Name:</strong> {track.trackName || 'N/A'}</span>
                                <span class="text-gray-800 dark:text-gray-200"><strong>Source:</strong> {track.source}</span>
                                <span class="px-2 py-1 rounded" class:bg-green-100={!track.muted} class:text-green-800={!track.muted} class:dark:bg-green-800={!track.muted} class:dark:text-green-200={!track.muted} class:bg-red-100={track.muted} class:text-red-800={track.muted} class:dark:bg-red-800={track.muted} class:dark:text-red-200={track.muted}>
                                  {track.muted ? 'Muted' : 'Active'}
                                </span>
                                <span class="px-2 py-1 rounded" class:bg-green-100={track.enabled} class:text-green-800={track.enabled} class:dark:bg-green-800={track.enabled} class:dark:text-green-200={track.enabled} class:bg-gray-200={!track.enabled} class:text-gray-800={!track.enabled} class:dark:bg-gray-600={!track.enabled} class:dark:text-gray-200={!track.enabled}>
                                  {track.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <span class="px-2 py-1 rounded" class:bg-blue-100={track.subscribed} class:text-blue-800={track.subscribed} class:dark:bg-blue-800={track.subscribed} class:dark:text-blue-200={track.subscribed} class:bg-gray-200={!track.subscribed} class:text-gray-800={!track.subscribed} class:dark:bg-gray-600={!track.subscribed} class:dark:text-gray-200={!track.subscribed}>
                                  {track.subscribed ? 'Subscribed' : 'Not Subscribed'}
                                </span>
                                {#if track.encrypted}
                                  <span class="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">🔒 Encrypted</span>
                                {/if}
                              </div>
                            </div>
                          {/each}
                        </div>
                      {/if}

                      <!-- Video Tracks -->
                      {#if participant.videoTrackPublications.length > 0}
                        <div>
                          <strong class="text-gray-900 dark:text-gray-100">Video Tracks:</strong>
                          {#each participant.videoTrackPublications as track}
                            <div class="mt-1 p-2 bg-white dark:bg-gray-800 rounded border border-gray-300 dark:border-gray-600">
                              <div class="flex flex-wrap gap-2 text-xs">
                                <span class="text-gray-800 dark:text-gray-200"><strong>SID:</strong> {track.trackSid}</span>
                                <span class="text-gray-800 dark:text-gray-200"><strong>Name:</strong> {track.trackName || 'N/A'}</span>
                                <span class="text-gray-800 dark:text-gray-200"><strong>Source:</strong> {track.source}</span>
                                {#if track.dimensions}
                                  <span class="text-gray-800 dark:text-gray-200"><strong>Resolution:</strong> {track.dimensions.width}x{track.dimensions.height}</span>
                                {/if}
                                <span class="px-2 py-1 rounded" class:bg-green-100={!track.muted} class:text-green-800={!track.muted} class:dark:bg-green-800={!track.muted} class:dark:text-green-200={!track.muted} class:bg-red-100={track.muted} class:text-red-800={track.muted} class:dark:bg-red-800={track.muted} class:dark:text-red-200={track.muted}>
                                  {track.muted ? 'Muted' : 'Active'}
                                </span>
                                <span class="px-2 py-1 rounded" class:bg-green-100={track.enabled} class:text-green-800={track.enabled} class:dark:bg-green-800={track.enabled} class:dark:text-green-200={track.enabled} class:bg-gray-200={!track.enabled} class:text-gray-800={!track.enabled} class:dark:bg-gray-600={!track.enabled} class:dark:text-gray-200={!track.enabled}>
                                  {track.enabled ? 'Enabled' : 'Disabled'}
                                </span>
                                <span class="px-2 py-1 rounded" class:bg-blue-100={track.subscribed} class:text-blue-800={track.subscribed} class:dark:bg-blue-800={track.subscribed} class:dark:text-blue-200={track.subscribed} class:bg-gray-200={!track.subscribed} class:text-gray-800={!track.subscribed} class:dark:bg-gray-600={!track.subscribed} class:dark:text-gray-200={!track.subscribed}>
                                  {track.subscribed ? 'Subscribed' : 'Not Subscribed'}
                                </span>
                                {#if track.encrypted}
                                  <span class="bg-yellow-100 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded">🔒 Encrypted</span>
                                {/if}
                              </div>
                            </div>
                          {/each}
                        </div>
                      {/if}
                    </div>
                  </div>
                {/if}
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
  <div class="rounded-lg p-4 border dark:bg-gray-800 dark:border-gray-700" 
       class:bg-blue-50={isStreamer} 
       class:border-blue-200={isStreamer} 
       class:bg-green-50={!isStreamer} 
       class:border-green-200={!isStreamer}>
    <h3 class="text-sm font-medium mb-2"
        class:text-blue-800={isStreamer} 
        class:dark:text-blue-400={isStreamer}
        class:text-green-800={!isStreamer} 
        class:dark:text-green-400={!isStreamer}>
      ℹ️ Info
    </h3>
    <p class="text-sm"
       class:text-blue-700={isStreamer} 
       class:dark:text-blue-300={isStreamer}
       class:text-green-700={!isStreamer} 
       class:dark:text-green-300={!isStreamer}>
      {isStreamer 
        ? 'Sobald du streamst, können andere auf der Viewer-Seite deinen Stream sehen.'
        : 'Live-Streams werden automatisch erkannt und angezeigt. Bei Unterbrechungen wird automatisch neu verbunden.'
      }
    </p>
  </div>
</div>