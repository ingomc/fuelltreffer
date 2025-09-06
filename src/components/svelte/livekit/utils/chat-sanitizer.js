/**
 * Chat Message Sanitizer
 * Provides XSS protection and content filtering for chat messages
 */

// Blocked patterns for spam/abuse prevention
const BLOCKED_PATTERNS = [
  /(<script[^>]*>.*?<\/script>)/gi,  // Script tags
  /javascript:/gi,                   // JavaScript URLs
  /on\w+\s*=/gi,                    // Event handlers (onclick, onload, etc.)
  /<iframe[^>]*>/gi,                // iframes
  /<object[^>]*>/gi,                // Object embeds
  /<embed[^>]*>/gi,                 // Embed tags
];

// Spam detection patterns - Made less restrictive
const SPAM_PATTERNS = [
  /(.)\1{15,}/g,                    // Repeated characters (15+ times instead of 10)
  // Removed URL blocking for now
];

// Rate limiting storage - Made less restrictive
const MESSAGE_HISTORY = new Map();
const RATE_LIMIT = {
  maxMessages: 20,      // Increased from 10 to 20
  timeWindow: 60000,    // 1 minute in milliseconds
  minInterval: 200      // Reduced from 500ms to 200ms
};

/**
 * Sanitize chat message content
 * @param {string} message - Raw message content
 * @param {string} participantId - Sender's participant ID
 * @returns {Object} - {sanitized: string, blocked: boolean, reason?: string}
 */
export function sanitizeChatMessage(message, participantId) {
  console.log('Sanitizing message:', { message, participantId });
  
  if (!message || typeof message !== 'string') {
    console.log('Blocked: Invalid message type');
    return { sanitized: '', blocked: true, reason: 'Invalid message' };
  }

  // Trim and basic length check
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    console.log('Blocked: Empty message');
    return { sanitized: '', blocked: true, reason: 'Empty message' };
  }
  
  if (trimmed.length > 500) {
    console.log('Truncated: Message too long');
    return { 
      sanitized: trimmed.substring(0, 500) + '...', 
      blocked: false, 
      reason: 'Message truncated (too long)' 
    };
  }

  // Check for blocked patterns
  for (const pattern of BLOCKED_PATTERNS) {
    if (pattern.test(trimmed)) {
      console.log('Blocked: Prohibited content detected');
      return { 
        sanitized: '', 
        blocked: true, 
        reason: 'Message contains prohibited content' 
      };
    }
  }

  // Check for spam patterns
  for (const pattern of SPAM_PATTERNS) {
    if (pattern.test(trimmed)) {
      // Clean up repeated characters but don't block
      const cleaned = trimmed.replace(/(.)\1{6,}/g, '$1$1$1'); // Max 3 repetitions
      console.log('Cleaned: Spam pattern detected');
      return { 
        sanitized: cleaned, 
        blocked: false, 
        reason: 'Message cleaned (spam pattern detected)' 
      };
    }
  }

  // Rate limiting check - temporarily disabled for debugging
  // const rateLimitResult = checkRateLimit(participantId);
  // if (!rateLimitResult.allowed) {
  //   console.log('Blocked: Rate limit exceeded');
  //   return { 
  //     sanitized: '', 
  //     blocked: true, 
  //     reason: rateLimitResult.reason 
  //   };
  // }

  // HTML entity encoding for safety
  const sanitized = encodeHTMLEntities(trimmed);
  console.log('Sanitized successfully:', sanitized);

  return { sanitized, blocked: false };
}

/**
 * Sanitize participant name
 * @param {string} name - Raw participant name
 * @returns {string} - Sanitized name
 */
export function sanitizeParticipantName(name) {
  if (!name || typeof name !== 'string') {
    return 'Anonymous';
  }

  // Remove HTML and limit length
  const cleaned = name
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .replace(/[<>&"']/g, '') // Remove dangerous characters
    .trim()
    .substring(0, 50); // Max 50 characters

  return cleaned || 'Anonymous';
}

/**
 * Check rate limiting for participant
 * @param {string} participantId - Participant ID
 * @returns {Object} - {allowed: boolean, reason?: string}
 */
function checkRateLimit(participantId) {
  const now = Date.now();
  const userHistory = MESSAGE_HISTORY.get(participantId) || { messages: [], lastMessage: 0 };

  // Check minimum interval between messages
  if (now - userHistory.lastMessage < RATE_LIMIT.minInterval) {
    return { 
      allowed: false, 
      reason: 'Sending messages too quickly' 
    };
  }

  // Clean old messages outside time window
  userHistory.messages = userHistory.messages.filter(
    timestamp => now - timestamp < RATE_LIMIT.timeWindow
  );

  // Check message count in time window
  if (userHistory.messages.length >= RATE_LIMIT.maxMessages) {
    return { 
      allowed: false, 
      reason: 'Rate limit exceeded (too many messages)' 
    };
  }

  // Update history
  userHistory.messages.push(now);
  userHistory.lastMessage = now;
  MESSAGE_HISTORY.set(participantId, userHistory);

  return { allowed: true };
}

/**
 * Encode HTML entities to prevent XSS
 * @param {string} text - Text to encode
 * @returns {string} - Encoded text
 */
function encodeHTMLEntities(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

/**
 * Clear rate limiting data for a participant (e.g., when they leave)
 * @param {string} participantId - Participant ID
 */
export function clearParticipantHistory(participantId) {
  MESSAGE_HISTORY.delete(participantId);
}

/**
 * Clear all rate limiting data
 */
export function clearAllHistory() {
  MESSAGE_HISTORY.clear();
}