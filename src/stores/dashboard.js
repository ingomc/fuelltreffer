/* global URL */
import { get, writable } from 'svelte/store';
import { trackEvent } from '../utils/umami.js';

export const DASHBOARD_TABS = ['overview', 'matches', 'team', 'table'];

// Shared by the navigation and the dashboard island. Both are only written in
// the browser, so nothing leaks between server-rendered requests.
export const activeTab = writable(null);
export const navCounts = writable({});

export function resolveTab(value) {
  return DASHBOARD_TABS.includes(value) ? value : 'overview';
}

/** Switches the dashboard view without a page load and keeps the URL shareable. */
export function selectTab(tabId) {
  const previousTab = get(activeTab);
  activeTab.set(tabId);

  const url = new URL(window.location.href);
  if (tabId === 'overview') {
    url.searchParams.delete('tab');
  } else {
    url.searchParams.set('tab', tabId);
  }
  window.history.replaceState({}, '', url.toString());

  trackEvent('tab_switch', {
    from_tab: previousTab,
    to_tab: tabId,
    tabs_available: DASHBOARD_TABS.join(','),
    page: window.location.pathname
  });

  // Manually track the page view in Umami if available
  if (window.umami && typeof window.umami.track === 'function') {
    window.umami.track(props => ({
      ...props,
      url: window.location.pathname + window.location.search
    }));
  }

  window.scrollTo({ top: 0 });
}
