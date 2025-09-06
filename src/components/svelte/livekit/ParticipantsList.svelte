<script>
  import { participants, expandedParticipant, toggleParticipantDetails } from './utils/livekit-store.js';
</script>

{#if $participants.length > 0}
  <div class="participants-list">
    <div class="participants-header">
      <span>👥</span>
      <span>Teilnehmer ({$participants.length})</span>
    </div>
    
    <div class="participants-grid">
      {#each $participants as participant (participant.sid)}
        <div 
          class="participant-card"
          role="button"
          tabindex="0"
          on:click={() => toggleParticipantDetails(participant.sid)}
          on:keydown={(e) => e.key === 'Enter' && toggleParticipantDetails(participant.sid)}
        >
          <div class="participant-header">
            <div class="participant-avatar">
              {participant.identity.charAt(0).toUpperCase()}
            </div>
            
            <div class="participant-info">
              <div class="participant-name">
                {participant.identity}
                {#if participant.isLocal}
                  <span style="color: #10b981;">(Du)</span>
                {/if}
              </div>
              
              <div class="participant-status">
                {#if participant.connectionState}
                  Verbindung: {participant.connectionState}
                {/if}
                
                {#if participant.isCameraEnabled}
                  📹
                {/if}
                {#if participant.isMicrophoneEnabled}
                  🎤
                {/if}
                {#if participant.isScreenShareEnabled}
                  🖥️
                {/if}
              </div>
            </div>
          </div>
          
          {#if $expandedParticipant === participant.sid}
            <div class="participant-details">
              <div><strong>SID:</strong> {participant.sid}</div>
              <div><strong>Name:</strong> {participant.name}</div>
              
              {#if participant.joinedAt}
                <div><strong>Beigetreten:</strong> {new Date(participant.joinedAt).toLocaleTimeString()}</div>
              {/if}
              
              {#if participant.connectionQuality}
                <div><strong>Verbindungsqualität:</strong> {participant.connectionQuality}</div>
              {/if}
              
              {#if participant.audioTrackPublications.length > 0}
                <div><strong>Audio Tracks:</strong> {participant.audioTrackPublications.length}</div>
              {/if}
              
              {#if participant.videoTrackPublications.length > 0}
                <div><strong>Video Tracks:</strong> {participant.videoTrackPublications.length}</div>
              {/if}
              
              {#if participant.permissions}
                <div>
                  <strong>Berechtigungen:</strong>
                  {participant.permissions.canPublish ? '📤 Senden' : ''}
                  {participant.permissions.canSubscribe ? '📥 Empfangen' : ''}
                  {participant.permissions.recorder ? '🔴 Aufzeichnung' : ''}
                </div>
              {/if}
            </div>
          {/if}
        </div>
      {/each}
    </div>
  </div>
{/if}

<style>
  @import './utils/livekit.css';
</style>
