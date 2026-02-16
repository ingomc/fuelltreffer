/**
 * Umami Analytics Utilities
 * Provides easy-to-use functions for tracking events
 */

/**
 * Track a custom event in Umami
 * @param {string} eventName - The name of the event
 * @param {Object} eventData - Additional event data
 */
export function trackEvent(eventName, eventData = {}) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(eventName, eventData);
  }
}

/**
 * Track page views (automatically handled by Umami script)
 * @param {string} url - The URL to track
 * @param {Object} options - Additional tracking options
 */
export function trackPageView(url, options = {}) {
  if (typeof window !== 'undefined' && window.umami) {
    window.umami.track(url, options);
  }
}

/**
 * Track user interactions
 */
export const trackUserInteraction = {
  /**
   * Track tab visibility changes
   */
  tabVisibility: () => {
    if (typeof window === 'undefined') return;
    
    let lastVisibilityChange = Date.now();
    let timeOnTab = 0;
    
    const handleVisibilityChange = () => {
      const now = Date.now();
      
      if (document.hidden) {
        // Tab became hidden
        timeOnTab = now - lastVisibilityChange;
        trackEvent('tab_hidden', {
          time_on_tab: Math.round(timeOnTab / 1000), // seconds
          page: window.location.pathname
        });
      } else {
        // Tab became visible
        trackEvent('tab_visible', {
          page: window.location.pathname,
          return_time: now - lastVisibilityChange > 5000 ? 'long' : 'short'
        });
        lastVisibilityChange = now;
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Track initial load
    trackEvent('tab_loaded', {
      page: window.location.pathname,
      referrer: document.referrer
    });
  },

  /**
   * Track navigation events
   */
  navigation: () => {
    if (typeof window === 'undefined') return;
    
    // Track external link clicks
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (link && link.href && !link.href.startsWith(window.location.origin)) {
        trackEvent('external_link_click', {
          url: link.href,
          text: link.textContent.trim().substring(0, 50),
          page: window.location.pathname
        });
      }
    });
    
    // Track hash changes (for SPA navigation)
    window.addEventListener('hashchange', () => {
      trackEvent('hash_navigation', {
        from: document.referrer,
        to: window.location.hash,
        page: window.location.pathname
      });
    });
  },

  /**
   * Track user engagement
   */
  engagement: () => {
    if (typeof window === 'undefined') return;
    
    let scrollDepth = 0;
    let maxScrollDepth = 0;
    let readingTime = 0;
    let isReading = true;
    
    // Track scroll depth
    const trackScrollDepth = () => {
      const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
      const documentHeight = document.documentElement.scrollHeight - window.innerHeight;
      scrollDepth = Math.round((scrollTop / documentHeight) * 100);
      maxScrollDepth = Math.max(maxScrollDepth, scrollDepth);
      
      // Track milestone scrolls
      if (scrollDepth >= 25 && !window.umami_scroll_25) {
        window.umami_scroll_25 = true;
        trackEvent('scroll_depth', { depth: 25, page: window.location.pathname });
      }
      if (scrollDepth >= 50 && !window.umami_scroll_50) {
        window.umami_scroll_50 = true;
        trackEvent('scroll_depth', { depth: 50, page: window.location.pathname });
      }
      if (scrollDepth >= 75 && !window.umami_scroll_75) {
        window.umami_scroll_75 = true;
        trackEvent('scroll_depth', { depth: 75, page: window.location.pathname });
      }
      if (scrollDepth >= 90 && !window.umami_scroll_90) {
        window.umami_scroll_90 = true;
        trackEvent('scroll_depth', { depth: 90, page: window.location.pathname });
      }
    };
    
    // Track reading time
    const startReadingTime = Date.now();
    const trackReadingTime = () => {
      if (isReading) {
        readingTime = Date.now() - startReadingTime;
      }
    };
    
    // Events
    window.addEventListener('scroll', trackScrollDepth);
    window.addEventListener('beforeunload', () => {
      trackReadingTime();
      trackEvent('page_exit', {
        reading_time: Math.round(readingTime / 1000),
        max_scroll_depth: maxScrollDepth,
        page: window.location.pathname
      });
    });
    
    // Track when user stops/starts reading (focus/blur)
    window.addEventListener('blur', () => { isReading = false; });
    window.addEventListener('focus', () => { isReading = true; });
  },

  /**
   * Track specific application events
   */
  appEvents: () => {
    if (typeof window === 'undefined') return;
    
    // Track search usage
    document.addEventListener('submit', (event) => {
      const form = event.target;
      const searchInput = form.querySelector('input[type="search"], input[name*="search"]');
      if (searchInput && searchInput.value) {
        trackEvent('search_performed', {
          query_length: searchInput.value.length,
          page: window.location.pathname
        });
      }
    });
    
    // Track button clicks with data attributes
    document.addEventListener('click', (event) => {
      const button = event.target.closest('button, [role="button"]');
      if (button && button.dataset.track) {
        trackEvent('button_click', {
          button_type: button.dataset.track,
          button_text: button.textContent.trim().substring(0, 30),
          page: window.location.pathname
        });
      }
    });
    
    // Track form interactions
    document.addEventListener('focusin', (event) => {
      const input = event.target.closest('input, select, textarea');
      if (input && input.name) {
        trackEvent('form_interaction', {
          field_type: input.type || input.tagName.toLowerCase(),
          field_name: input.name,
          page: window.location.pathname
        });
      }
    });
  }
};

/**
 * Initialize all tracking features
 */
export function initializeTracking() {
  if (typeof window === 'undefined') return;
  
  // Wait for DOM to be ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      setupTracking();
    });
  } else {
    setupTracking();
  }
}

function setupTracking() {
  trackUserInteraction.tabVisibility();
  trackUserInteraction.navigation();
  trackUserInteraction.engagement();
  trackUserInteraction.appEvents();
  
  // Track initial page load
  trackEvent('page_loaded', {
    page: window.location.pathname,
    user_agent: navigator.userAgent,
    screen_resolution: `${screen.width}x${screen.height}`,
    viewport: `${window.innerWidth}x${window.innerHeight}`
  });
}

/**
 * Track specific Dart/Sports events
 */
export const trackDartEvents = {
  matchView: (matchId, eventId) => {
    trackEvent('match_viewed', {
      match_id: matchId,
      event_id: eventId,
      page: window.location.pathname
    });
  },
  
  teamView: (teamId) => {
    trackEvent('team_viewed', {
      team_id: teamId,
      page: window.location.pathname
    });
  },
  
  participantView: (participantId) => {
    trackEvent('participant_viewed', {
      participant_id: participantId,
      page: window.location.pathname
    });
  },
  
  leagueTableView: (eventId) => {
    trackEvent('league_table_viewed', {
      event_id: eventId,
      page: window.location.pathname
    });
  },
  
  streamInteraction: (action, streamId) => {
    trackEvent('stream_interaction', {
      action: action, // 'start', 'stop', 'join', 'leave'
      stream_id: streamId,
      page: window.location.pathname
    });
  },
  
  reportSubmission: (matchId, reportType) => {
    trackEvent('report_submitted', {
      match_id: matchId,
      report_type: reportType, // 'match_result', 'statistics', etc.
      page: window.location.pathname
    });
  }
};