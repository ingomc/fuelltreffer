/**
 * Simplified Chat Message Sanitizer
 * Basic XSS protection without aggressive filtering
 */

/**
 * Sanitize chat message content - simplified version
 * @param {string} message - Raw message content
 * @param {string} participantId - Sender's participant ID (unused in simple version)
 * @returns {Object} - {sanitized: string, blocked: boolean, reason?: string}
 */
export function sanitizeChatMessageSimple(message, _participantId = 'unknown') {
  if (!message || typeof message !== 'string') {
    return { sanitized: '', blocked: true, reason: 'Invalid message' };
  }

  // Trim and basic length check
  const trimmed = message.trim();
  if (trimmed.length === 0) {
    return { sanitized: '', blocked: true, reason: 'Empty message' };
  }
  
  // Only basic length limiting
  if (trimmed.length > 1000) {
    return { 
      sanitized: trimmed.substring(0, 1000) + '...', 
      blocked: false, 
      reason: 'Message truncated (too long)' 
    };
  }

  // Only block obvious script attempts
  const hasScript = /<script|javascript:|on\w+\s*=/i.test(trimmed);
  if (hasScript) {
    return { 
      sanitized: '', 
      blocked: true, 
      reason: 'Message contains prohibited content' 
    };
  }

  // Simple HTML entity encoding
  const sanitized = trimmed
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

  return { sanitized, blocked: false };
}

/**
 * Sanitize participant name - simplified
 */
export function sanitizeParticipantNameSimple(name) {
  if (!name || typeof name !== 'string') {
    return 'Anonymous';
  }

  // Basic cleaning
  const cleaned = name
    .replace(/[<>&"']/g, '') // Remove dangerous characters
    .trim()
    .substring(0, 100); // Max 100 characters

  return cleaned || 'Anonymous';
}
