// Frontend Configuration
// Diese Werte werden zur Build-Zeit gesetzt

export const config = {
  // Backend URL für API Calls
  API_BASE_URL: import.meta.env.PUBLIC_BACKEND_URL || 'http://localhost:4001',
  
  // Default Participant ID
  DEFAULT_PARTICIPANT_ID: '308868',
  
  // Development vs Production
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD
};

console.log('Frontend Config:', config);