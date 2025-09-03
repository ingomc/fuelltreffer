import { writable } from 'svelte/store';

// Global store to manage which tooltip is currently open
export const openTooltip = writable(null);