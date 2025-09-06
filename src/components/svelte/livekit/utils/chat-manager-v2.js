/**
 * LiveKit Chat Manager - Clean Implementation
 * Following LiveKit best practices for reliable messaging
 */

import { addChatMessage, setUserTyping, clearAllTyping } from './chat-store-v2.js';

// Use globalThis for better compatibility
const TextDecoder = globalThis.TextDecoder;
const TextEncoder = globalThis.TextEncoder;

// Simple content filtering - LiveKit handles the heavy lifting
function sanitizeContent(content) {
  if (!content || typeof content !== 'string') return '';
  
  // Basic length limit and trim
  const cleaned = content.trim();
  if (cleaned.length > 1000) {
    return cleaned.substring(0, 1000) + '...';
  }
  
  // Only filter obvious HTML/script attempts - let LiveKit handle the rest
  return cleaned.replace(/<script[^>]*>.*?<\/script>/gi, '[script removed]');
}

function sanitizeName(name) {
  if (!name || typeof name !== 'string') return 'Anonymous';
  return name.trim().substring(0, 50) || 'Anonymous';
}

/**
 * Setup chat handlers for LiveKit room
 */
export function setupChatHandlers(room) {
  if (!room) {
    console.warn('No room provided to setupChatHandlers');
    return;
  }

  console.log('Setting up chat handlers...');

  // Chat message handler
  room.on('dataReceived', (payload, participant, kind, topic) => {
    if (topic === 'chat' && kind === 'reliable') {
      try {
        const decoder = new TextDecoder();
        const message = decoder.decode(payload);
        const content = sanitizeContent(message);
        
        if (content) {
          addChatMessage({
            participantName: sanitizeName(participant?.name || participant?.identity),
            participantId: participant?.identity || 'unknown',
            content: content,
            type: 'message',
            timestamp: Date.now()
          });
        }
      } catch (error) {
        console.error('Error processing chat message:', error);
      }
    }
    
    // Typing indicator handler
    if (topic === 'typing' && kind === 'lossy') {
      try {
        const decoder = new TextDecoder();
        const status = decoder.decode(payload);
        const isTyping = status === 'start';
        const userName = sanitizeName(participant?.name || participant?.identity);
        
        // Store handles auto-cleanup now
        setUserTyping(userName, isTyping);
        
      } catch (error) {
        console.error('Error processing typing indicator:', error);
      }
    }
  });

  console.log('Chat handlers registered successfully');
}

/**
 * Send chat message using LiveKit data channel
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
    // Add message locally for immediate feedback
    addChatMessage({
      participantName: sanitizeName(senderName || 'You'),
      participantId: 'local',
      content: content,
      type: 'message',
      isOwnMessage: true,
      timestamp: Date.now()
    });

    // Send via LiveKit data channel
    const encoder = new TextEncoder();
    const data = encoder.encode(content);
    
    await room.localParticipant.publishData(data, {
      reliable: true,
      destinationIdentities: [], // Send to all participants
      topic: 'chat'
    });

    console.log('Chat message sent successfully');
    return true;

  } catch (error) {
    console.error('Failed to send chat message:', error);
    return false;
  }
}

/**
 * Send typing indicator
 */
export async function sendTypingIndicator(room, isTyping) {
  if (!room?.localParticipant) return;

  try {
    const encoder = new TextEncoder();
    const status = isTyping ? 'start' : 'stop';
    const data = encoder.encode(status);
    
    await room.localParticipant.publishData(data, {
      reliable: false, // Use lossy for real-time indicators
      destinationIdentities: [],
      topic: 'typing'
    });
    
    console.log('Typing indicator sent:', status);
  } catch (error) {
    console.error('Failed to send typing indicator:', error);
  }
}

/**
 * Clean up chat handlers
 */
export function cleanupChatHandlers(room) {
  if (!room) return;
  
  // Clear all typing indicators when cleaning up
  clearAllTyping();
  
  // LiveKit will automatically clean up event listeners when room disconnects
  console.log('Chat handlers cleanup complete');
}
