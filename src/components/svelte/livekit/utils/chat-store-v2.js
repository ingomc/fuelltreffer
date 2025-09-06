import { writable } from 'svelte/store';

// Chat state
export const chatMessages = writable([]);
export const typingUsers = writable([]);

// Chat settings
export const chatEnabled = writable(true);
export const showTimestamps = writable(true);

// Typing timeouts for auto-cleanup
const typingTimeouts = new Map();

/**
 * Add a new chat message
 */
export function addChatMessage(message) {
  chatMessages.update(messages => {
    const newMessages = [...messages, {
      id: `${Date.now()}-${Math.random()}`, // Better unique ID
      timestamp: new Date(),
      ...message
    }];
    
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
  typingUsers.set([]);
  typingTimeouts.clear();
}

/**
 * Set typing indicator for a user with auto-cleanup
 */
export function setUserTyping(participantName, typing) {
  if (!participantName || participantName === 'You' || participantName === 'local') {
    return; // Don't show typing for self
  }

  // Clear existing timeout for this user
  if (typingTimeouts.has(participantName)) {
    globalThis.clearTimeout(typingTimeouts.get(participantName));
    typingTimeouts.delete(participantName);
  }

  typingUsers.update(users => {
    const filtered = users.filter(u => u !== participantName);
    
    if (typing) {
      // Add user to typing list
      const newUsers = [...filtered, participantName];
      
      // Set auto-cleanup timeout
      const timeoutId = globalThis.setTimeout(() => {
        setUserTyping(participantName, false);
      }, 5000); // 5 seconds timeout
      
      typingTimeouts.set(participantName, timeoutId);
      return newUsers;
    } else {
      // Remove user from typing list
      return filtered;
    }
  });
}

/**
 * Clear typing indicator for a user
 */
export function clearUserTyping(participantName) {
  setUserTyping(participantName, false);
}

/**
 * Clear all typing indicators
 */
export function clearAllTyping() {
  // Clear all timeouts
  typingTimeouts.forEach(timeoutId => globalThis.clearTimeout(timeoutId));
  typingTimeouts.clear();
  
  // Clear typing users
  typingUsers.set([]);
}
