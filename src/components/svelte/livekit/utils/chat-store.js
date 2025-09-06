import { writable } from 'svelte/store';

// Chat state
export const chatMessages = writable([]);
export const isTyping = writable(false);
export const typingUsers = writable([]);

// Chat settings
export const chatEnabled = writable(true);
export const showTimestamps = writable(true);

/**
 * Add a new chat message
 */
export function addChatMessage(message) {
  // Validate message object
  if (!message || typeof message !== 'object') {
    console.warn('Invalid message object:', message);
    return;
  }

  chatMessages.update(messages => {
    // Ensure messages is always an array
    const currentMessages = Array.isArray(messages) ? messages : [];
    
    const newMessage = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // Better unique ID using substring
      timestamp: new Date(),
      ...message
    };
    
    const newMessages = [...currentMessages, newMessage];
    
    // Keep only last 100 messages for performance
    if (newMessages.length > 100) {
      return newMessages.slice(-100);
    }
    
    return newMessages;
  });
}

/**
 * Clear all chat messages
 */
export function clearChat() {
  chatMessages.set([]);
}

/**
 * Add or remove typing indicator
 */
export function setUserTyping(participantName, typing) {
  // Validate inputs
  if (!participantName || typeof participantName !== 'string') {
    return;
  }

  // Don't show typing for self
  if (participantName === 'You' || participantName === 'local') {
    return;
  }

  typingUsers.update(users => {
    // Ensure users is always an array
    const currentUsers = Array.isArray(users) ? users : [];
    
    if (typing) {
      // Add user if not already in list
      return currentUsers.includes(participantName) 
        ? currentUsers 
        : [...currentUsers, participantName];
    } else {
      // Remove user from list
      return currentUsers.filter(u => u !== participantName);
    }
  });
}
