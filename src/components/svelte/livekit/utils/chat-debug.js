/**
 * Chat Debug Utils
 * Helper functions to monitor chat performance and debug issues
 */

// Debug state
let messageCount = 0;
let lastMessageTime = 0;
let errorCount = 0;

/**
 * Log chat performance metrics
 */
export function logChatMetrics() {
  const now = Date.now();
  const timeSinceLastMessage = now - lastMessageTime;
  
  console.group('🔍 Chat Debug Metrics');
  console.log('Messages sent/received:', messageCount);
  console.log('Errors encountered:', errorCount);
  console.log('Time since last message:', timeSinceLastMessage + 'ms');
  console.log('Messages per minute:', Math.round(messageCount / ((now - (now - 60000)) / 60000)));
  console.groupEnd();
}

/**
 * Track message sent/received
 */
export function trackMessage() {
  messageCount++;
  lastMessageTime = Date.now();
}

/**
 * Track error occurrence
 */
export function trackError(error, context) {
  errorCount++;
  console.warn(`❌ Chat Error [${context}]:`, error);
}

/**
 * Reset debug counters
 */
export function resetMetrics() {
  messageCount = 0;
  lastMessageTime = 0;
  errorCount = 0;
  console.log('🔄 Chat metrics reset');
}

// Auto-reset metrics every 5 minutes
if (typeof globalThis !== 'undefined') {
  globalThis.setInterval(resetMetrics, 5 * 60 * 1000);
}
