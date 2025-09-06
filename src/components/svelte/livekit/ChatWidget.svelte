<script>
  import { onMount, onDestroy } from 'svelte';
  import { chatMessages, typingUsers, chatEnabled, showTimestamps } from './utils/chat-store.js';
  import { sendChatMessage } from './utils/chat-manager-fixed.js';
  import { TypingManager } from './utils/typing-manager.js';
  import { room, participantName } from './utils/livekit-store.js';
  import { get } from 'svelte/store';

  // Use globalThis for better compatibility
  const clearTimeout = globalThis.clearTimeout;
  const setTimeout = globalThis.setTimeout;
  const requestAnimationFrame = globalThis.requestAnimationFrame;

  let chatContainer;
  let messageInput = '';
  let inputElement;
  let isMinimized = false;
  let typingManager = null;
  let isUserScrolled = false;
  let scrollTimeout;

  // Initialize typing manager when room and user info are available
  $: if ($room && $participantName && !typingManager) {
    typingManager = new TypingManager($room, { 
      id: $participantName, 
      name: $participantName 
    });
    
    // Update typing users when changes occur
    typingManager.setTypingChangeHandler((users) => {
      typingUsers.set(users);
    });
  }

  // Cleanup when component is destroyed
  onDestroy(() => {
    if (typingManager) {
      typingManager.destroy();
    }
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
  });

  // Check if user is scrolled to bottom
  function isScrolledToBottom() {
    if (!chatContainer) return true;
    const threshold = 50; // 50px threshold
    return (
      chatContainer.scrollHeight - chatContainer.scrollTop - chatContainer.clientHeight <= threshold
    );
  }

  // Handle scroll events to track user scrolling
  function handleScroll() {
    if (scrollTimeout) {
      clearTimeout(scrollTimeout);
    }
    
    // Set flag that user is actively scrolling
    isUserScrolled = !isScrolledToBottom();
    
    // Reset user scrolled flag after 2 seconds of no scrolling
    scrollTimeout = setTimeout(() => {
      isUserScrolled = false;
    }, 2000);
  }

  // Smart auto-scroll based on best practices
  function smartScrollToBottom() {
    if (!chatContainer) return;
    
    // Only auto-scroll if user is at bottom or hasn't manually scrolled up
    if (!isUserScrolled || isScrolledToBottom()) {
      requestAnimationFrame(() => {
        if (chatContainer) {
          chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
          });
        }
      });
    }
  }

  // Auto-scroll when new messages arrive - Chat Best Practice
  $: if ($chatMessages && chatContainer && $chatMessages.length > 0) {
    smartScrollToBottom();
  }

  function handleInputChange() {
    // Notify typing manager immediately when user types
    if (typingManager) {
      typingManager.handleInput();
    }
  }

  async function handleSendMessage() {
    if (!messageInput.trim()) return;

    const currentRoom = get(room);
    if (!currentRoom) return;

    try {
      await sendChatMessage(currentRoom, messageInput, $participantName);
      messageInput = '';
      
      // Signal that user sent a message (stop typing)
      if (typingManager) {
        typingManager.handleSend();
      }
      
      // Always scroll to bottom when user sends a message
      setTimeout(() => {
        if (chatContainer) {
          chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
          });
          isUserScrolled = false; // Reset scroll state
        }
      }, 100);
      
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  }

  function handleKeyPress(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      handleSendMessage();
    }
  }

  function formatTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString('de-DE', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  function getMessageColor(participantId) {
    if (participantId === 'system') return '#888';
    
    // Generate consistent colors based on participant ID
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', 
      '#FECA57', '#FF9FF3', '#54A0FF', '#5F27CD'
    ];
    
    const hash = participantId.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  }
</script>

<div class="chat-widget" class:minimized={isMinimized}>
  <div class="chat-header">
    <h3>💬 Live Chat</h3>
    <div class="chat-controls">
      <button 
        class="control-btn"
        on:click={() => isMinimized = !isMinimized}
        title={isMinimized ? 'Chat öffnen' : 'Chat minimieren'}
      >
        {isMinimized ? '📈' : '📉'}
      </button>
      <button 
        class="control-btn"
        class:active={$chatEnabled}
        on:click={() => chatEnabled.set(!$chatEnabled)}
        title="Chat stumm/laut"
      >
        {$chatEnabled ? '🔊' : '🔇'}
      </button>
    </div>
  </div>

  {#if $chatEnabled && !isMinimized}
    <div class="chat-messages" bind:this={chatContainer} on:scroll={handleScroll}>
      {#each $chatMessages as message (message.id)}
        <div class="message-wrapper" class:own-message={message.isOwnMessage}>
          <div class="message-bubble" class:system={message.type === 'system'} class:own={message.isOwnMessage}>
            {#if !message.isOwnMessage && message.type !== 'system'}
              <div class="message-sender" style="color: {getMessageColor(message.participantId)}">
                {message.participantName}
              </div>
            {/if}
            
            <div class="message-content">
              {message.content}
            </div>
            
            {#if $showTimestamps}
              <div class="message-time">
                {formatTime(message.timestamp)}
              </div>
            {/if}
          </div>
        </div>
      {/each}
    </div>

    <!-- Typing indicator - fixed at bottom left -->
    {#if $typingUsers.length > 0}
      <div class="typing-indicator-fixed">
        <div class="typing-bubble">
          <span class="typing-text">
            {$typingUsers.join(', ')} 
            {$typingUsers.length === 1 ? 'schreibt' : 'schreiben'}...
          </span>
          <div class="typing-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    {/if}

    <div class="chat-input-container">
      <input
        bind:this={inputElement}
        bind:value={messageInput}
        on:input={handleInputChange}
        on:keypress={handleKeyPress}
        placeholder="Nachricht schreiben..."
        class="chat-input"
        maxlength="500"
      />
      <button 
        class="send-btn"
        on:click={handleSendMessage}
        disabled={!messageInput.trim()}
      >
        ➤
      </button>
    </div>
  {/if}
</div>

<style>
  .chat-widget {
    width: 300px;
    background: rgba(0, 0, 0, 0.85);
    border-radius: 8px;
    display: flex;
    flex-direction: column;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    border: 1px solid rgba(255, 255, 255, 0.15);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    transition: height 0.3s ease;
    height: 400px;
    position: relative; /* For absolute positioning of typing indicator */
  }

  .chat-widget.minimized {
    height: auto;
  }

  .chat-header {
    padding: 12px 16px;
    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
    display: flex;
    justify-content: space-between;
    align-items: center;
    background: rgba(255, 255, 255, 0.05);
    border-radius: 12px 12px 0 0;
  }

  .chat-header h3 {
    margin: 0;
    font-size: 14px;
    font-weight: 600;
    color: white;
  }

  .chat-controls {
    display: flex;
    gap: 4px;
  }

  .control-btn {
    background: transparent;
    border: none;
    font-size: 16px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s;
    padding: 4px;
    border-radius: 4px;
  }

  .control-btn:hover,
  .control-btn.active {
    opacity: 1;
    background: rgba(255, 255, 255, 0.1);
  }

  .chat-messages {
    flex: 1;
    overflow-y: auto;
    padding: 8px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
    position: relative;
    /* Better scroll behavior */
    scroll-behavior: smooth;
  }

  .chat-messages::-webkit-scrollbar {
    width: 6px;
  }

  .chat-messages::-webkit-scrollbar-track {
    background: transparent;
  }

  .chat-messages::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }

  .message-wrapper {
    display: flex;
    margin-bottom: 12px;
    animation: slideIn 0.3s ease-out;
  }

  .message-wrapper.own-message {
    justify-content: flex-end;
  }

  .message-bubble {
    max-width: 70%;
    padding: 10px 14px;
    border-radius: 18px;
    position: relative;
    word-wrap: break-word;
    font-size: 14px;
    line-height: 1.4;
  }

  /* Other people's messages - gray bubbles on left */
  .message-bubble:not(.own):not(.system) {
    background: rgba(255, 255, 255, 0.15);
    color: white;
    border-bottom-left-radius: 4px;
    margin-right: auto;
  }

  /* Own messages - blue bubbles on right */
  .message-bubble.own {
    background: linear-gradient(135deg, #007AFF 0%, #0056CC 100%);
    color: white;
    border-bottom-right-radius: 4px;
    margin-left: auto;
    box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3);
  }

  /* System messages - centered, subtle */
  .message-bubble.system {
    background: rgba(136, 136, 136, 0.2);
    color: rgba(255, 255, 255, 0.8);
    font-style: italic;
    font-size: 12px;
    text-align: center;
    border-radius: 12px;
    margin: 8px auto;
    max-width: 80%;
  }

  .message-sender {
    font-size: 11px;
    font-weight: 600;
    margin-bottom: 2px;
    opacity: 0.9;
  }

  .message-content {
    word-break: break-word;
  }

  .message-time {
    font-size: 10px;
    opacity: 0.7;
    margin-top: 4px;
    text-align: right;
  }

  .message-bubble:not(.own) .message-time {
    text-align: left;
  }

  .typing-indicator-fixed {
    position: absolute;
    bottom: 70px; /* Above input field */
    left: 8px;
    right: 8px;
    display: flex;
    pointer-events: none;
    z-index: 20;
    animation: slideIn 0.3s ease-out;
  }

  .typing-bubble {
    background: rgba(0, 0, 0, 0.85);
    color: white;
    border-radius: 18px;
    border-bottom-left-radius: 4px;
    padding: 10px 14px;
    display: flex;
    align-items: center;
    gap: 8px;
    max-width: 70%;
    font-size: 13px;
    animation: fadeInUp 0.3s ease-out;
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    pointer-events: auto;
  }

  .typing-text {
    color: rgba(255, 255, 255, 0.8);
    font-size: 12px;
    font-style: italic;
  }

  .typing-dots {
    display: flex;
    gap: 2px;
  }

  .typing-dots span {
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.7);
    border-radius: 50%;
    animation: typing 1.4s infinite ease-in-out;
  }

  .typing-dots span:nth-child(2) {
    animation-delay: 0.2s;
  }

  .typing-dots span:nth-child(3) {
    animation-delay: 0.4s;
  }

  .chat-input-container {
    display: flex;
    gap: 8px;
    padding: 12px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(255, 255, 255, 0.02);
    border-radius: 0 0 12px 12px;
  }

  .chat-input {
    flex: 1;
    background: rgba(255, 255, 255, 0.1);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 20px;
    padding: 8px 12px;
    color: white;
    font-size: 13px;
    outline: none;
    transition: all 0.2s;
  }

  .chat-input:focus {
    border-color: rgba(255, 255, 255, 0.4);
    background: rgba(255, 255, 255, 0.15);
  }

  .chat-input::placeholder {
    color: rgba(255, 255, 255, 0.5);
  }

  .send-btn {
    background: #4CAF50;
    border: none;
    border-radius: 20px;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    cursor: pointer;
    transition: all 0.2s;
  }

  .send-btn:hover:not(:disabled) {
    background: #45a049;
    transform: scale(1.05);
  }

  .send-btn:disabled {
    background: rgba(255, 255, 255, 0.1);
    cursor: not-allowed;
    color: rgba(255, 255, 255, 0.3);
  }

  @keyframes slideIn {
    from {
      opacity: 0;
      transform: translateY(10px) scale(0.95);
    }
    to {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes typing {
    0%, 60%, 100% {
      transform: scale(0.8);
      opacity: 0.5;
    }
    30% {
      transform: scale(1);
      opacity: 1;
    }
  }

  @keyframes fadeInUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Mobile responsiveness */
  @media (max-width: 768px) {
    .chat-widget {
      width: 100%;
      height: 400px;
    }
  }
</style>
