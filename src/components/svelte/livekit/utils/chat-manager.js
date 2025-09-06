import { addChatMessage, setUserTyping } from './chat-store.js';
import { sanitizeChatMessageSimple as sanitizeChatMessage, sanitizeParticipantNameSimple as sanitizeParticipantName } from './chat-sanitizer-simple.js';

/**
 * Setup chat text stream handlers for LiveKit room
 */
export function setupChatHandlers(room) {
  if (!room) return;

  // Register handler for chat messages
  room.registerTextStreamHandler('chat', async (reader, participantInfo) => {
    const message = await reader.readAll();
    
    // Sanitize the incoming message
    const sanitizedName = sanitizeParticipantName(participantInfo.name || participantInfo.identity);
    const sanitizeResult = sanitizeChatMessage(message, participantInfo.identity);
    
    if (sanitizeResult.blocked) {
      console.warn('Blocked message:', sanitizeResult.reason);
      return; // Don't add blocked messages
    }
    
    addChatMessage({
      participantName: sanitizedName,
      participantId: participantInfo.identity,
      content: sanitizeResult.sanitized,
      type: 'message'
    });
  });

  // Register handler for typing indicators
  room.registerTextStreamHandler('typing', async (reader, participantInfo) => {
    const typingStatus = await reader.readAll();
    const isTyping = typingStatus === 'start';
    
    const sanitizedName = sanitizeParticipantName(participantInfo.name || participantInfo.identity);
    setUserTyping(sanitizedName, isTyping);
    
    // Auto-clear typing indicator after 3 seconds
    if (isTyping) {
      globalThis.setTimeout(() => {
        setUserTyping(sanitizedName, false);
      }, 3000);
    }
  });

  console.log('Chat handlers registered');
}

/**
 * Send a chat message to all participants
 */
export async function sendChatMessage(room, message, senderName) {
  if (!room || !message.trim()) return;

  try {
    // Sanitize message before sending
    const sanitizeResult = sanitizeChatMessage(message, 'local');
    console.log('Sanitize result:', sanitizeResult);
    
    if (sanitizeResult.blocked) {
      console.warn('Message blocked:', sanitizeResult.reason);
      return; // Don't send blocked messages
    }

    const sanitizedName = sanitizeParticipantName(senderName || 'You');
    
    // First add the message locally for immediate feedback
    addChatMessage({
      participantName: sanitizedName,
      participantId: 'local',
      content: sanitizeResult.sanitized,
      type: 'message',
      isOwnMessage: true
    });

    // Then send to others via LiveKit
    await room.localParticipant.sendText(sanitizeResult.sanitized, {
      topic: 'chat'
    });
    
    console.log('Chat message sent:', sanitizeResult.sanitized);
  } catch (error) {
    console.error('Error sending chat message:', error);
    throw error;
  }
}

/**
 * Send typing indicator
 */
export async function sendTypingIndicator(room, isTyping) {
  if (!room) return;

  try {
    await room.localParticipant.sendText(isTyping ? 'start' : 'stop', {
      topic: 'typing'
    });
  } catch (error) {
    console.error('Error sending typing indicator:', error);
  }
}

/**
 * Send system message (for join/leave notifications)
 */
export function addSystemMessage(content) {
  addChatMessage({
    participantName: 'System',
    participantId: 'system',
    content,
    type: 'system'
  });
}
