/**
 * Smart Typing Indicator Manager
 * Implements intelligent debouncing/throttling for efficient typing notifications
 */

// Use globalThis for better compatibility
const clearTimeout = globalThis.clearTimeout;
const setTimeout = globalThis.setTimeout;

// Typing state management
let isCurrentlyTyping = false;
let lastKeyPressTime = 0;
let typingStartTimeout = null;
let typingStopTimeout = null;
let debounceTimeout = null;

// Configuration
const TYPING_CONFIG = {
  startDelay: 300,        // 300ms delay before sending "start typing"
  stopDelay: 10000,       // 10 seconds of inactivity before "stop typing"
  debounceTime: 500,      // 500ms debounce for key presses
  minTypingDuration: 1000 // Minimum time to show "typing" (prevents flicker)
};

/**
 * Smart typing indicator that only sends necessary notifications
 * @param {Function} sendCallback - Function to send typing status to backend
 * @param {boolean} isInput - True if user is actively typing
 */
export function handleSmartTyping(sendCallback, isInput = true) {
  const now = Date.now();
  
  if (isInput) {
    // User is typing - handle start logic
    handleTypingStart(sendCallback, now);
  } else {
    // User stopped typing (sent message) - force stop
    handleTypingStop(sendCallback, true);
  }
}

/**
 * Handle typing start with debouncing
 */
function handleTypingStart(sendCallback, now) {
  lastKeyPressTime = now;
  
  // Clear any existing stop timeout
  if (typingStopTimeout) {
    clearTimeout(typingStopTimeout);
    typingStopTimeout = null;
  }
  
  // If not currently typing, start the "typing start" process
  if (!isCurrentlyTyping) {
    // Clear existing start timeout
    if (typingStartTimeout) {
      clearTimeout(typingStartTimeout);
    }
    
    // Debounce the start notification
    typingStartTimeout = setTimeout(() => {
      // Double-check user is still typing
      if (now - lastKeyPressTime >= TYPING_CONFIG.startDelay) {
        return; // User stopped typing during delay
      }
      
      isCurrentlyTyping = true;
      sendCallback(true); // Send "start typing"
      console.log('🟢 Started typing notification sent');
      
      // Setup automatic stop detection
      setupAutoStop(sendCallback);
      
    }, TYPING_CONFIG.startDelay);
  } else {
    // Already typing, just update the auto-stop timer
    setupAutoStop(sendCallback);
  }
}

/**
 * Handle typing stop
 */
function handleTypingStop(sendCallback, immediate = false) {
  // Clear all timeouts
  if (typingStartTimeout) {
    clearTimeout(typingStartTimeout);
    typingStartTimeout = null;
  }
  
  if (typingStopTimeout) {
    clearTimeout(typingStopTimeout);
    typingStopTimeout = null;
  }
  
  if (isCurrentlyTyping) {
    const delay = immediate ? 0 : 100; // Small delay for message send
    
    setTimeout(() => {
      isCurrentlyTyping = false;
      sendCallback(false); // Send "stop typing"
      console.log('🔴 Stopped typing notification sent');
    }, delay);
  }
}

/**
 * Setup automatic stop detection
 */
function setupAutoStop(sendCallback) {
  // Clear existing timeout
  if (typingStopTimeout) {
    clearTimeout(typingStopTimeout);
  }
  
  // Set new timeout
  typingStopTimeout = setTimeout(() => {
    handleTypingStop(sendCallback, true);
  }, TYPING_CONFIG.stopDelay);
}

/**
 * Reset typing state (for cleanup)
 */
export function resetTypingState() {
  // Clear all timeouts
  if (typingStartTimeout) {
    clearTimeout(typingStartTimeout);
    typingStartTimeout = null;
  }
  
  if (typingStopTimeout) {
    clearTimeout(typingStopTimeout);
    typingStopTimeout = null;
  }
  
  if (debounceTimeout) {
    clearTimeout(debounceTimeout);
    debounceTimeout = null;
  }
  
  // Reset state
  isCurrentlyTyping = false;
  lastKeyPressTime = 0;
  
  console.log('🔄 Typing state reset');
}

/**
 * Get current typing status
 */
export function isTyping() {
  return isCurrentlyTyping;
}

/**
 * Debug function to log typing state
 */
export function logTypingState() {
  console.group('⌨️ Typing Debug State');
  console.log('Currently typing:', isCurrentlyTyping);
  console.log('Last keypress:', new Date(lastKeyPressTime).toLocaleTimeString());
  console.log('Time since last keypress:', Date.now() - lastKeyPressTime + 'ms');
  console.log('Active timeouts:', {
    start: !!typingStartTimeout,
    stop: !!typingStopTimeout,
    debounce: !!debounceTimeout
  });
  console.groupEnd();
}
