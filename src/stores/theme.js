import { writable } from 'svelte/store';

// Theme store mit persistierung
function createThemeStore() {
  const { subscribe, set } = writable('system');

  return {
    subscribe,
    set: (theme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('theme', theme);
        applyTheme(theme);
      }
      set(theme);
    },
    init: () => {
      if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('theme') || 'system';
        applyTheme(saved);
        set(saved);
      }
    }
  };
}

function applyTheme(theme) {
  if (typeof window === 'undefined') return;
  
  const html = document.documentElement;
  
  if (theme === 'dark') {
    html.classList.add('dark');
  } else if (theme === 'light') {
    html.classList.remove('dark');
  } else { // system
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    if (prefersDark) {
      html.classList.add('dark');
    } else {
      html.classList.remove('dark');
    }
  }
}

export const theme = createThemeStore();

// Listen for system theme changes
if (typeof window !== 'undefined') {
  window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (_e) => {
    // Only auto-switch if user has system preference selected
    const currentTheme = localStorage.getItem('theme') || 'system';
    if (currentTheme === 'system') {
      applyTheme('system');
    }
  });
}