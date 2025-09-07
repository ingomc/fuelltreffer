// Layout Manager for Streamer Grid System
import { writable } from 'svelte/store';

// Check if we're in browser environment
const isBrowser = typeof window !== 'undefined';

// Grid configuration store
export const gridConfig = writable({
  columns: 12, // 12-column grid system
  rows: 8,     // 8-row grid system 
  gap: 16      // Gap between grid items in pixels
});

// Grid items store - tracks position and size of each element
export const gridItems = writable([
  {
    id: 'camera',
    title: 'Kamera',
    type: 'video',
    x: 0,    // Grid column start (0-based)
    y: 0,    // Grid row start (0-based) 
    width: 6, // Grid columns spanned
    height: 4, // Grid rows spanned
    minWidth: 3,
    minHeight: 2,
    component: 'camera'
  },
  {
    id: 'screenshare', 
    title: 'Bildschirm teilen',
    type: 'video',
    x: 6,    // Start at column 6
    y: 0,    // Top row
    width: 6, // Span 6 columns  
    height: 4, // Span 4 rows
    minWidth: 4,
    minHeight: 3,
    component: 'screenshare'
  },
  {
    id: 'chat',
    title: 'Chat',
    type: 'chat', 
    x: 8,    // Start at column 8
    y: 4,    // Start at row 4
    width: 4, // Span 4 columns
    height: 4, // Span 4 rows  
    minWidth: 3,
    minHeight: 3,
    component: 'chat'
  }
]);

// Predefined layout templates
export const layoutTemplates = {
  default: [
    { id: 'camera', x: 0, y: 0, width: 6, height: 4 },
    { id: 'screenshare', x: 6, y: 0, width: 6, height: 4 },
    { id: 'chat', x: 8, y: 4, width: 4, height: 4 }
  ],
  fullCamera: [
    { id: 'camera', x: 0, y: 0, width: 9, height: 6 },
    { id: 'screenshare', x: 9, y: 0, width: 3, height: 3 },
    { id: 'chat', x: 9, y: 3, width: 3, height: 5 }
  ],
  fullScreenshare: [
    { id: 'camera', x: 9, y: 0, width: 3, height: 3 },
    { id: 'screenshare', x: 0, y: 0, width: 9, height: 6 },
    { id: 'chat', x: 9, y: 3, width: 3, height: 5 }
  ],
  chatFocus: [
    { id: 'camera', x: 0, y: 0, width: 4, height: 4 },
    { id: 'screenshare', x: 4, y: 0, width: 4, height: 4 },
    { id: 'chat', x: 8, y: 0, width: 4, height: 8 }
  ]
};

// Local storage key for persisting layouts
const LAYOUT_STORAGE_KEY = 'streamer-grid-layout';

// Load saved layout from localStorage
export function loadSavedLayout() {
  if (!isBrowser) return false;
  
  try {
    const saved = localStorage.getItem(LAYOUT_STORAGE_KEY);
    if (saved) {
      const layout = JSON.parse(saved);
      gridItems.set(layout);
      console.log('✅ Loaded saved grid layout');
      return true;
    }
  } catch (error) {
    console.error('❌ Error loading saved layout:', error);
  }
  return false;
}

// Save current layout to localStorage  
export function saveCurrentLayout() {
  if (!isBrowser) return;
  
  try {
    gridItems.subscribe(items => {
      localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(items));
    })();
    console.log('✅ Saved grid layout');
  } catch (error) {
    console.error('❌ Error saving layout:', error);
  }
}

// Apply a predefined template
export function applyTemplate(templateName) {
  const template = layoutTemplates[templateName];
  if (!template) {
    console.error('❌ Unknown template:', templateName);
    return;
  }
  
  gridItems.update(items => {
    return items.map(item => {
      const templateItem = template.find(t => t.id === item.id);
      if (templateItem) {
        return { ...item, ...templateItem };
      }
      return item;
    });
  });
  
  console.log('✅ Applied template:', templateName);
}

// Update item position and size
export function updateGridItem(id, updates) {
  gridItems.update(items => {
    return items.map(item => {
      if (item.id === id) {
        return { ...item, ...updates };
      }
      return item;
    });
  });
}

// Check if position is valid (no overlaps, within bounds)
export function isValidPosition(id, x, y, width, height, currentItems = null) {
  if (currentItems === null) {
    // We need to get current items synchronously
    let items = [];
    gridItems.subscribe(i => items = i)(); 
    currentItems = items;
  }
  
  const config = { columns: 12, rows: 8 }; // Default config
  
  // Check bounds
  if (x < 0 || y < 0 || x + width > config.columns || y + height > config.rows) {
    return false;
  }
  
  // Check overlaps with other items
  for (const item of currentItems) {
    if (item.id === id) continue; // Skip self
    
    const overlaps = !(
      x >= item.x + item.width || // Completely to the right
      x + width <= item.x ||      // Completely to the left  
      y >= item.y + item.height || // Completely below
      y + height <= item.y        // Completely above
    );
    
    if (overlaps) {
      return false;
    }
  }
  
  return true;
}

// Find the nearest valid position for dropping an item
export function findNearestValidPosition(id, targetX, targetY, width, height) {
  let items = [];
  gridItems.subscribe(i => items = i)();
  
  // Try the exact position first
  if (isValidPosition(id, targetX, targetY, width, height, items)) {
    return { x: targetX, y: targetY };
  }
  
  // Search in expanding radius around target position
  for (let radius = 1; radius <= 6; radius++) {
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dy = -radius; dy <= radius; dy++) {
        const x = Math.max(0, targetX + dx);
        const y = Math.max(0, targetY + dy);
        
        if (isValidPosition(id, x, y, width, height, items)) {
          return { x, y };
        }
      }
    }
  }
  
  // Fallback: find any valid position
  const config = { columns: 12, rows: 8 };
  for (let y = 0; y <= config.rows - height; y++) {
    for (let x = 0; x <= config.columns - width; x++) {
      if (isValidPosition(id, x, y, width, height, items)) {
        return { x, y };
      }
    }
  }
  
  // Should never reach here, but return original position as fallback
  return { x: targetX, y: targetY };
}

// Initialize layout manager
export function initializeLayoutManager() {
  // Try to load saved layout, otherwise use default
  if (!loadSavedLayout()) {
    console.log('📋 Using default layout');
  }
  
  // Auto-save when items change
  gridItems.subscribe(() => {
    // Debounce saves to avoid excessive localStorage writes
    if (isBrowser) {
      if (window.gridSaveTimeout) {
        window.clearTimeout(window.gridSaveTimeout);
      }
      window.gridSaveTimeout = window.setTimeout(saveCurrentLayout, 1000);
    }
  });
  
  console.log('🎛️ Grid layout manager initialized');
}