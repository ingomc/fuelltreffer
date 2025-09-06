/**
 * LiveKit Chat Manager - Back to Basics
 * Using the original, working implementation with fixes
 */

import { addChatMessage, setUserTyping } from './chat-store.js';

// Simple, minimal sanitization - let LiveKit handle the rest
function sanitizeContent(content) {
  if (!content || typeof content !== 'string') return '';
  return content.trim().substring(0, 1000); // Only length limit
}

function sanitizeName(name) {
  if (!name || typeof name !== 'string') return 'Anonymous';
  return name.trim().substring(0, 50) || 'Anonymous';
}

/**
 * Setup chat handlers for LiveKit room - Original working version
 */
export function setupChatHandlers(room) {
  if (!room) {
    console.warn('No room provided to setupChatHandlers');
    return;
  }

  console.log('Setting up chat handlers...');

  // Chat message handler - ORIGINAL WORKING VERSION
  room.registerTextStreamHandler('chat', async (reader, participantInfo) => {
    try {
      const message = await reader.readAll();
      const content = sanitizeContent(message);
      
      if (content) {
        const messageData = {
          participantName: sanitizeName(participantInfo.name || participantInfo.identity),
          participantId: participantInfo.identity,
          content: content,
          type: 'message',
          timestamp: Date.now()
        };
        
        // Add message with error handling
        try {
          addChatMessage(messageData);
          console.log('Chat message received:', content);
        } catch (storeError) {
          console.error('Error adding message to store:', storeError);
          // Try again with minimal data
          addChatMessage({
            participantName: 'Unknown',
            participantId: 'unknown',
            content: content,
            type: 'message'
          });
        }
      }
    } catch (error) {
      console.error('Error processing chat message:', error);
    }
  });

  // Typing indicator handler - ORIGINAL WORKING VERSION  
  room.registerTextStreamHandler('typing', async (reader, participantInfo) => {
    try {
      const typingStatus = await reader.readAll();
      const isTyping = typingStatus === 'start';
      const userName = sanitizeName(participantInfo.name || participantInfo.identity);
      
      setUserTyping(userName, isTyping);
      
      // Auto-clear typing after 3 seconds - KEEP THIS SIMPLE
      if (isTyping) {
        globalThis.setTimeout(() => {
          setUserTyping(userName, false);
        }, 3000);
      }
      
      console.log('Typing indicator:', userName, isTyping);
    } catch (error) {
      console.error('Error processing typing indicator:', error);
    }
  });

  console.log('Chat handlers registered successfully');
}

/**
 * Send chat message - ORIGINAL WORKING VERSION
 */
export async function sendChatMessage(room, message, senderName) {
  if (!room?.localParticipant) {
    console.error('No room or local participant available');
    return false;
  }

  const content = sanitizeContent(message);
  if (!content) {
    console.warn('Empty or invalid message content');
    return false;
  }

  try {
    // Add message locally for immediate feedback - ORIGINAL VERSION
    const localMessage = {
      participantName: sanitizeName(senderName || 'You'),
      participantId: 'local',
      content: content,
      type: 'message',
      isOwnMessage: true,
      timestamp: Date.now()
    };
    
    try {
      addChatMessage(localMessage);
    } catch (storeError) {
      console.error('Error adding local message to store:', storeError);
      // Continue sending even if local add fails
    }

    // Send via LiveKit text stream - ORIGINAL WORKING METHOD
    await room.localParticipant.sendText(content, {
      topic: 'chat'
    });

    console.log('Chat message sent successfully:', content);
    return true;

  } catch (error) {
    console.error('Failed to send chat message:', error);
    return false;
  }
}

/**
 * Send typing indicator - ORIGINAL WORKING VERSION
 */
export async function sendTypingIndicator(room, isTyping) {
  if (!room?.localParticipant) return;

  try {
    const status = isTyping ? 'start' : 'stop';
    
    await room.localParticipant.sendText(status, {
      topic: 'typing'
    });
    
    console.log('Typing indicator sent:', status);
  } catch (error) {
    console.error('Failed to send typing indicator:', error);
  }
}

/**
 * Add system message helper
 */
export function addSystemMessage(content) {
  addChatMessage({
    participantName: 'System',
    participantId: 'system',
    content: content,
    type: 'system',
    timestamp: Date.now()
  });
}
