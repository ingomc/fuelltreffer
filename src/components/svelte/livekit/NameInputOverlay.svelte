<script>
  import { userName, hasValidName, displayName, chatName, isStreamer, participantName } from './utils/livekit-store.js';
  import { get } from 'svelte/store';

  let inputValue = '';
  let inputElement;

  function handleSubmit() {
    const trimmedName = inputValue.trim();
    if (trimmedName.length >= 2) {
      const isStreamerMode = get(isStreamer);
      
      if (isStreamerMode) {
        // STREAMER: Andre -> Andre (Admin) (KEIN prefix mehr)
        displayName.set(`${trimmedName} (Admin)`); // UI: Andre (Admin)
        participantName.set(`${trimmedName} (Admin)`); // LiveKit: Andre (Admin)
        chatName.set(trimmedName); // Chat: Andre
      } else {
        // VIEWER: Fabian -> Fabian (KEIN prefix)
        displayName.set(trimmedName); // UI: Fabian
        participantName.set(trimmedName); // LiveKit: Fabian
        chatName.set(trimmedName); // Chat: Fabian
      }
      
      userName.set(trimmedName);
      hasValidName.set(true);
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSubmit();
    }
  }

  function handleInput() {
    // Auto-submit validation (optional)
  }

  // Focus input when component mounts
  import { onMount } from 'svelte';
  onMount(() => {
    if (inputElement) {
      inputElement.focus();
    }
  });
</script>

<div class="name-overlay">
  <div class="name-overlay-content">
    <div class="name-card">
      <div class="name-header">
        <h2>Willkommen!</h2>
        <p>Bitte gib deinen Namen ein um zu starten</p>
      </div>
      
      <form on:submit|preventDefault={handleSubmit} class="name-form">
        <div class="input-group">
          <label for="name-input">
            {#if $isStreamer}
              Dein Name (wird als Name (Admin) angezeigt):
            {:else}
              Dein Name:
            {/if}
          </label>
          <input
            id="name-input"
            autocomplete="off"
            bind:this={inputElement}
            bind:value={inputValue}
            on:input={handleInput}
            on:keypress={handleKeyPress}
            type="text"
            placeholder="Name eingeben"
            maxlength="20"
            required
          />
          
          {#if inputValue.trim().length >= 2}
            <div class="name-preview">
              Angezeigt als: <strong>
                {#if $isStreamer}
                  {inputValue.trim()} (Admin)
                {:else}
                  {inputValue.trim()}
                {/if}
              </strong>
            </div>
          {/if}
        </div>
        
        <button 
          type="submit" 
          class="submit-btn"
          disabled={inputValue.trim().length < 2}
        >
          {#if $isStreamer}
            Stream starten
          {:else}
            Stream beitreten
          {/if}
        </button>
      </form>
    </div>
  </div>
</div>

<style>
  .name-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: fadeIn 0.3s ease-out;
  }

  .name-overlay-content {
    width: 100%;
    max-width: 400px;
    padding: 20px;
  }

  .name-card {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 32px;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    animation: slideIn 0.4s ease-out;
  }

  .name-header {
    text-align: center;
    margin-bottom: 24px;
  }

  .name-header h2 {
    color: white;
    font-size: 24px;
    font-weight: 600;
    margin: 0 0 8px 0;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .name-header p {
    color: rgba(255, 255, 255, 0.7);
    font-size: 14px;
    margin: 0;
  }

  .name-form {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .input-group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .input-group label {
    color: rgba(255, 255, 255, 0.8);
    font-size: 14px;
    font-weight: 500;
  }

  .input-group input {
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 8px;
    padding: 12px 16px;
    color: white;
    font-size: 16px;
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .input-group input:focus {
    outline: none;
    border-color: #007AFF;
    background: rgba(255, 255, 255, 0.15);
    box-shadow: 0 0 0 3px rgba(0, 122, 255, 0.2);
  }

  .input-group input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .name-preview {
    background: rgba(0, 122, 255, 0.1);
    border: 1px solid rgba(0, 122, 255, 0.3);
    border-radius: 6px;
    padding: 8px 12px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 12px;
    animation: fadeIn 0.2s ease-out;
  }

  .name-preview strong {
    color: #007AFF;
  }

  .submit-btn {
    background: #007AFF;
    color: white;
    border: none;
    border-radius: 8px;
    padding: 14px 24px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .submit-btn:hover:not(:disabled) {
    background: #0056CC;
    transform: translateY(-1px);
    box-shadow: 0 4px 16px rgba(0, 122, 255, 0.3);
  }

  .submit-btn:disabled {
    background: rgba(255, 255, 255, 0.1);
    color: rgba(255, 255, 255, 0.3);
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(20px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  /* Mobile responsive */
  @media (max-width: 480px) {
    .name-overlay-content {
      padding: 16px;
    }

    .name-card {
      padding: 24px;
    }

    .name-header h2 {
      font-size: 20px;
    }
  }
</style>
