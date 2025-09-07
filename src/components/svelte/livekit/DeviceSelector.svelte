<script>
  import { onMount } from 'svelte';
  import { 
    availableVideoDevices, 
    availableAudioDevices, 
    selectedVideoDevice, 
    selectedAudioDevice, 
    initializeDevices,
    selectVideoDevice,
    selectAudioDevice,
    getDeviceLabel
  } from './utils/device-manager.js';
  import { switchVideoDevice } from './utils/video-manager.js';
  import { switchAudioDevice, localAudioTrack } from './utils/audio-manager.js';
  import { localVideoTrack } from './utils/livekit-store.js';

  // Props to control when device selection is shown
  export let showDeviceSelection = true;
  export let allowSwitching = true;

  let isInitialized = false;
  let initError = null;

  onMount(async () => {
    try {
      await initializeDevices();
      isInitialized = true;
    } catch (error) {
      console.error('Failed to initialize devices:', error);
      initError = error.message;
    }
  });

  // Handle video device selection
  async function handleVideoDeviceChange(event) {
    const deviceId = event.target.value;
    const device = $availableVideoDevices.find(d => d.deviceId === deviceId);
    
    if (!device) return;
    
    selectVideoDevice(device);
    
    // If streaming is active and switching is allowed, switch device
    if ($localVideoTrack && allowSwitching) {
      try {
        await switchVideoDevice(device);
      } catch (error) {
        console.error('Failed to switch video device:', error);
      }
    }
  }

  // Handle audio device selection
  async function handleAudioDeviceChange(event) {
    const deviceId = event.target.value;
    const device = $availableAudioDevices.find(d => d.deviceId === deviceId);
    
    if (!device) return;
    
    selectAudioDevice(device);
    
    // If streaming is active and switching is allowed, switch device
    if ($localAudioTrack && allowSwitching) {
      try {
        await switchAudioDevice(device);
      } catch (error) {
        console.error('Failed to switch audio device:', error);
      }
    }
  }
</script>

{#if showDeviceSelection}
  <div class="device-selection">
    <h3 class="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200">
      📹 Geräte-Auswahl
    </h3>
    
    {#if initError}
      <div class="error-message bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        <p><strong>❌ Fehler:</strong> {initError}</p>
        <p class="text-sm mt-1">Stelle sicher, dass Browser-Berechtigungen für Kamera und Mikrofon erteilt sind.</p>
      </div>
    {:else if !isInitialized}
      <div class="loading-message bg-blue-100 border border-blue-400 text-blue-700 px-4 py-3 rounded mb-4">
        <p>🔄 Geräte werden erkannt...</p>
      </div>
    {:else}
      <div class="device-controls space-y-4">
        <!-- Camera Selection -->
        <div class="device-group">
          <label for="camera-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            📹 Kamera auswählen:
          </label>
          <select 
            id="camera-select"
            class="device-select w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            on:change={handleVideoDeviceChange}
            value={$selectedVideoDevice?.deviceId || ''}
          >
            <option value="" disabled>Kamera wählen...</option>
            {#each $availableVideoDevices as device, index}
              <option value={device.deviceId}>
                {getDeviceLabel(device, index, 'Kamera')}
              </option>
            {/each}
          </select>
          <p class="text-xs text-gray-500 mt-1">
            {$availableVideoDevices.length} Kamera{$availableVideoDevices.length !== 1 ? 's' : ''} verfügbar
          </p>
        </div>

        <!-- Microphone Selection -->
        <div class="device-group">
          <label for="microphone-select" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            🎤 Mikrofon auswählen:
          </label>
          <select 
            id="microphone-select"
            class="device-select w-full px-3 py-2 border border-gray-300 rounded-md bg-white dark:bg-gray-800 dark:border-gray-600 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            on:change={handleAudioDeviceChange}
            value={$selectedAudioDevice?.deviceId || ''}
          >
            <option value="" disabled>Mikrofon wählen...</option>
            {#each $availableAudioDevices as device, index}
              <option value={device.deviceId}>
                {getDeviceLabel(device, index, 'Mikrofon')}
              </option>
            {/each}
          </select>
          <p class="text-xs text-gray-500 mt-1">
            {$availableAudioDevices.length} Mikrofon{$availableAudioDevices.length !== 1 ? 'e' : ''} verfügbar
          </p>
        </div>

        {#if $localVideoTrack || $localAudioTrack}
          <div class="streaming-info bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded">
            <p class="text-sm">
              <strong>✅ Stream aktiv:</strong> 
              Geräte können jederzeit gewechselt werden, ohne den Stream zu unterbrechen.
            </p>
          </div>
        {/if}
      </div>
    {/if}
  </div>
{/if}

<style>
  .device-selection {
    background: #f9fafb;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 16px;
  }
  
  :global(.dark) .device-selection {
    background: #1f2937;
    border-color: #374151;
  }

  .device-select {
    transition: all 0.2s ease;
  }
  
  .device-select:hover {
    border-color: #3b82f6;
  }
  
  .device-group {
    position: relative;
  }
  
  .error-message, .loading-message {
    animation: fadeIn 0.3s ease;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>