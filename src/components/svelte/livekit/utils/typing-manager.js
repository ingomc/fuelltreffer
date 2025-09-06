/**
 * LiveKit Typing Indicator Manager
 * Uses separate topic for typing indicators based on LiveKit best practices
 */

// Use globalThis for better compatibility
const clearTimeout = globalThis.clearTimeout;
const setTimeout = globalThis.setTimeout;

export class TypingManager {
  constructor(room, userInfo) {
    this.room = room;
    this.userInfo = userInfo;
    this.isTyping = false;
    this.stopTimer = null;
    this.typingUsers = new Set();
    this.onTypingChange = null;
    
    this.setupTypingHandler();
  }

  /**
   * Setup handler for incoming typing notifications
   */
  setupTypingHandler() {
    this.room.registerTextStreamHandler('typing-indicators', async (reader, _participantInfo) => {
      try {
        const data = await reader.readAll();
        const typingData = JSON.parse(data);
        
        // Don't process our own typing notifications
        if (typingData.userId === this.userInfo.id) {
          return;
        }

        if (typingData.type === 'typing_start') {
          this.typingUsers.add(typingData.userId);
          console.log(`👤 ${typingData.user} started typing`);
        } else if (typingData.type === 'typing_stop') {
          this.typingUsers.delete(typingData.userId);
          console.log(`👤 ${typingData.user} stopped typing`);
        }

        // Notify UI about typing change
        if (this.onTypingChange) {
          this.onTypingChange(Array.from(this.typingUsers));
        }
      } catch (error) {
        console.error('Error processing typing notification:', error);
      }
    });
  }

  /**
   * Called when user starts typing (immediately on first keystroke)
   */
  handleInput() {
    // Clear any existing stop timer
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    // Send start notification immediately on first keystroke
    if (!this.isTyping) {
      this.isTyping = true;
      this.sendTypingStart();
    }

    // Always reset the 10s stop timer
    this.stopTimer = setTimeout(() => {
      this.stopTyping();
    }, 10000);
  }

  /**
   * Called when user sends a message
   */
  handleSend() {
    this.stopTyping();
  }

  /**
   * Stop typing and send notification
   */
  stopTyping() {
    if (this.stopTimer) {
      clearTimeout(this.stopTimer);
      this.stopTimer = null;
    }

    if (this.isTyping) {
      this.isTyping = false;
      this.sendTypingStop();
    }
  }

  /**
   * Send typing start notification using LiveKit sendText
   */
  async sendTypingStart() {
    try {
      await this.room.localParticipant.sendText(
        JSON.stringify({
          type: 'typing_start',
          user: this.userInfo.name,
          userId: this.userInfo.id,
          timestamp: Date.now()
        }),
        { topic: 'typing-indicators' }
      );
      console.log('🟢 Sent typing start notification');
    } catch (error) {
      console.error('Failed to send typing start:', error);
    }
  }

  /**
   * Send typing stop notification using LiveKit sendText
   */
  async sendTypingStop() {
    try {
      await this.room.localParticipant.sendText(
        JSON.stringify({
          type: 'typing_stop',
          user: this.userInfo.name,
          userId: this.userInfo.id,
          timestamp: Date.now()
        }),
        { topic: 'typing-indicators' }
      );
      console.log('🔴 Sent typing stop notification');
    } catch (error) {
      console.error('Failed to send typing stop:', error);
    }
  }

  /**
   * Set callback for typing changes
   */
  setTypingChangeHandler(callback) {
    this.onTypingChange = callback;
  }

  /**
   * Get current typing users
   */
  getTypingUsers() {
    return Array.from(this.typingUsers);
  }

  /**
   * Cleanup - call when component is destroyed
   */
  destroy() {
    this.stopTyping();
    this.typingUsers.clear();
  }
}
