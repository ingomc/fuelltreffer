<script>
  import { createEventDispatcher } from 'svelte';
  import { gridConfig } from './utils/layout-manager.js';
  
  export let id;
  export let title;
  export let type;
  export let x;
  export let y; 
  export let width;
  export let height;
  export let minWidth = 2;
  export let minHeight = 2;
  export let isDragging = false;
  export let isResizing = false;
  
  const dispatch = createEventDispatcher();
  
  let gridItem;
  let startX, startY;
  let startMouseX, startMouseY;
  let startWidth, startHeight;
  let resizeDirection = '';
  
  // Calculate CSS grid position
  $: gridArea = `${y + 1} / ${x + 1} / ${y + height + 1} / ${x + width + 1}`;
  
  // Handle drag start
  function handleDragStart(event) {
    if (isResizing) return;
    
    isDragging = true;
    startX = x;
    startY = y;
    startMouseX = event.clientX;
    startMouseY = event.clientY;
    
    // Prevent text selection during drag
    event.preventDefault();
    
    document.addEventListener('mousemove', handleDragMove);
    document.addEventListener('mouseup', handleDragEnd);
    
    dispatch('dragStart', { id });
  }
  
  // Handle drag movement
  function handleDragMove(event) {
    if (!isDragging) return;
    
    const deltaX = event.clientX - startMouseX;
    const deltaY = event.clientY - startMouseY;
    
    // Calculate grid cell size
    const gridRect = gridItem.parentElement.getBoundingClientRect();
    const cellWidth = (gridRect.width - ($gridConfig.gap * ($gridConfig.columns - 1))) / $gridConfig.columns;
    const cellHeight = (gridRect.height - ($gridConfig.gap * ($gridConfig.rows - 1))) / $gridConfig.rows;
    
    // Convert pixel delta to grid delta
    const gridDeltaX = Math.round(deltaX / (cellWidth + $gridConfig.gap));
    const gridDeltaY = Math.round(deltaY / (cellHeight + $gridConfig.gap));
    
    // Calculate new position
    const newX = Math.max(0, Math.min($gridConfig.columns - width, startX + gridDeltaX));
    const newY = Math.max(0, Math.min($gridConfig.rows - height, startY + gridDeltaY));
    
    // Update position if changed
    if (newX !== x || newY !== y) {
      dispatch('dragMove', { id, x: newX, y: newY, width, height });
    }
  }
  
  // Handle drag end  
  function handleDragEnd() {
    if (!isDragging) return;
    
    isDragging = false;
    
    document.removeEventListener('mousemove', handleDragMove);
    document.removeEventListener('mouseup', handleDragEnd);
    
    dispatch('dragEnd', { id });
  }
  
  // Handle resize start
  function handleResizeStart(event, direction) {
    event.stopPropagation();
    
    isResizing = true;
    resizeDirection = direction;
    startX = x;
    startY = y;
    startWidth = width;
    startHeight = height;
    startMouseX = event.clientX;
    startMouseY = event.clientY;
    
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    
    dispatch('resizeStart', { id });
  }
  
  // Handle resize movement
  function handleResizeMove(event) {
    if (!isResizing) return;
    
    const deltaX = event.clientX - startMouseX;
    const deltaY = event.clientY - startMouseY;
    
    // Calculate grid cell size
    const gridRect = gridItem.parentElement.getBoundingClientRect();
    const cellWidth = (gridRect.width - ($gridConfig.gap * ($gridConfig.columns - 1))) / $gridConfig.columns;
    const cellHeight = (gridRect.height - ($gridConfig.gap * ($gridConfig.rows - 1))) / $gridConfig.rows;
    
    // Convert pixel delta to grid delta
    const gridDeltaX = Math.round(deltaX / (cellWidth + $gridConfig.gap));
    const gridDeltaY = Math.round(deltaY / (cellHeight + $gridConfig.gap));
    
    let newX = startX;
    let newY = startY;
    let newWidth = startWidth;
    let newHeight = startHeight;
    
    // Apply resize based on direction
    switch (resizeDirection) {
      case 'se': // Southeast - resize width and height
        newWidth = Math.max(minWidth, Math.min($gridConfig.columns - startX, startWidth + gridDeltaX));
        newHeight = Math.max(minHeight, Math.min($gridConfig.rows - startY, startHeight + gridDeltaY));
        break;
      case 'sw': // Southwest - resize width (left) and height
        const widthDelta = -gridDeltaX;
        newWidth = Math.max(minWidth, Math.min(startX + startWidth, startWidth + widthDelta));
        newX = startX + startWidth - newWidth;
        newHeight = Math.max(minHeight, Math.min($gridConfig.rows - startY, startHeight + gridDeltaY));
        break;
      case 'ne': // Northeast - resize width and height (top)
        newWidth = Math.max(minWidth, Math.min($gridConfig.columns - startX, startWidth + gridDeltaX));
        const heightDelta = -gridDeltaY;
        newHeight = Math.max(minHeight, Math.min(startY + startHeight, startHeight + heightDelta));
        newY = startY + startHeight - newHeight;
        break;
      case 'nw': // Northwest - resize both directions from top-left
        const wDelta = -gridDeltaX;
        const hDelta = -gridDeltaY;
        newWidth = Math.max(minWidth, Math.min(startX + startWidth, startWidth + wDelta));
        newHeight = Math.max(minHeight, Math.min(startY + startHeight, startHeight + hDelta));
        newX = startX + startWidth - newWidth;
        newY = startY + startHeight - newHeight;
        break;
      case 'n': // North - resize height only (top)
        const hD = -gridDeltaY;
        newHeight = Math.max(minHeight, Math.min(startY + startHeight, startHeight + hD));
        newY = startY + startHeight - newHeight;
        break;
      case 's': // South - resize height only (bottom)
        newHeight = Math.max(minHeight, Math.min($gridConfig.rows - startY, startHeight + gridDeltaY));
        break;
      case 'e': // East - resize width only (right)
        newWidth = Math.max(minWidth, Math.min($gridConfig.columns - startX, startWidth + gridDeltaX));
        break;
      case 'w': // West - resize width only (left)
        const wD = -gridDeltaX;
        newWidth = Math.max(minWidth, Math.min(startX + startWidth, startWidth + wD));
        newX = startX + startWidth - newWidth;
        break;
    }
    
    // Dispatch resize event if anything changed
    if (newX !== x || newY !== y || newWidth !== width || newHeight !== height) {
      dispatch('resize', { id, x: newX, y: newY, width: newWidth, height: newHeight });
    }
  }
  
  // Handle resize end
  function handleResizeEnd() {
    if (!isResizing) return;
    
    isResizing = false;
    resizeDirection = '';
    
    document.removeEventListener('mousemove', handleResizeMove);
    document.removeEventListener('mouseup', handleResizeEnd);
    
    dispatch('resizeEnd', { id });
  }
</script>

<div 
  bind:this={gridItem}
  class="grid-item {type}"
  class:dragging={isDragging}
  class:resizing={isResizing}
  style="grid-area: {gridArea};"
  on:mousedown={handleDragStart}
>
  <!-- Drag Handle -->
  <div class="drag-handle" title="Ziehen zum Verschieben">
    <div class="drag-dots">
      <span></span><span></span><span></span>
      <span></span><span></span><span></span>
    </div>
    <span class="item-title">{title}</span>
  </div>
  
  <!-- Content Slot -->
  <div class="grid-item-content">
    <slot></slot>
  </div>
  
  <!-- Resize Handles -->
  <div class="resize-handle resize-n" on:mousedown={(e) => handleResizeStart(e, 'n')} title="Höhe anpassen"></div>
  <div class="resize-handle resize-s" on:mousedown={(e) => handleResizeStart(e, 's')} title="Höhe anpassen"></div>
  <div class="resize-handle resize-e" on:mousedown={(e) => handleResizeStart(e, 'e')} title="Breite anpassen"></div>
  <div class="resize-handle resize-w" on:mousedown={(e) => handleResizeStart(e, 'w')} title="Breite anpassen"></div>
  <div class="resize-handle resize-ne" on:mousedown={(e) => handleResizeStart(e, 'ne')} title="Größe anpassen"></div>
  <div class="resize-handle resize-nw" on:mousedown={(e) => handleResizeStart(e, 'nw')} title="Größe anpassen"></div>
  <div class="resize-handle resize-se" on:mousedown={(e) => handleResizeStart(e, 'se')} title="Größe anpassen"></div>
  <div class="resize-handle resize-sw" on:mousedown={(e) => handleResizeStart(e, 'sw')} title="Größe anpassen"></div>
</div>

<style>
  .grid-item {
    position: relative;
    background: rgba(0, 0, 0, 0.1);
    border: 2px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    overflow: hidden;
    transition: all 0.2s ease;
    cursor: move;
    min-height: 120px;
  }
  
  .grid-item:hover {
    border-color: rgba(59, 130, 246, 0.5);
    background: rgba(59, 130, 246, 0.05);
  }
  
  .grid-item.dragging {
    border-color: rgba(59, 130, 246, 0.8);
    background: rgba(59, 130, 246, 0.1);
    z-index: 1000;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    transform: rotate(2deg);
  }
  
  .grid-item.resizing {
    border-color: rgba(34, 197, 94, 0.8);
    background: rgba(34, 197, 94, 0.1);
  }
  
  .grid-item.video {
    background: rgba(0, 0, 0, 0.3);
  }
  
  .grid-item.chat {
    background: rgba(255, 255, 255, 0.05);
  }
  
  /* Drag Handle */
  .drag-handle {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 32px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.8), rgba(0, 0, 0, 0.6));
    backdrop-filter: blur(10px);
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 0 12px;
    z-index: 10;
    cursor: move;
  }
  
  .drag-dots {
    display: grid;
    grid-template-columns: repeat(3, 4px);
    grid-template-rows: repeat(2, 4px);
    gap: 2px;
    opacity: 0.7;
  }
  
  .drag-dots span {
    width: 4px;
    height: 4px;
    background: rgba(255, 255, 255, 0.8);
    border-radius: 50%;
  }
  
  .item-title {
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.85rem;
    font-weight: 600;
    user-select: none;
  }
  
  /* Content Area */
  .grid-item-content {
    position: absolute;
    top: 32px;
    left: 0;
    right: 0;
    bottom: 0;
    overflow: hidden;
  }
  
  /* Resize Handles */
  .resize-handle {
    position: absolute;
    background: rgba(59, 130, 246, 0.6);
    opacity: 0;
    transition: opacity 0.2s ease;
    z-index: 20;
  }
  
  .grid-item:hover .resize-handle {
    opacity: 1;
  }
  
  .resize-handle:hover {
    background: rgba(59, 130, 246, 0.8);
  }
  
  /* Edge resize handles */
  .resize-n, .resize-s {
    left: 20px;
    right: 20px;
    height: 6px;
    cursor: ns-resize;
  }
  
  .resize-n { top: -3px; }
  .resize-s { bottom: -3px; }
  
  .resize-e, .resize-w {
    top: 20px;
    bottom: 20px;
    width: 6px;
    cursor: ew-resize;
  }
  
  .resize-e { right: -3px; }
  .resize-w { left: -3px; }
  
  /* Corner resize handles */
  .resize-ne, .resize-nw, .resize-se, .resize-sw {
    width: 12px;
    height: 12px;
    border-radius: 50%;
  }
  
  .resize-ne { top: -6px; right: -6px; cursor: ne-resize; }
  .resize-nw { top: -6px; left: -6px; cursor: nw-resize; }
  .resize-se { bottom: -6px; right: -6px; cursor: se-resize; }
  .resize-sw { bottom: -6px; left: -6px; cursor: sw-resize; }
  
  /* Mobile adjustments */
  @media (max-width: 768px) {
    .drag-handle {
      height: 40px;
      padding: 0 16px;
    }
    
    .grid-item-content {
      top: 40px;
    }
    
    .resize-handle {
      opacity: 0.7; /* Always visible on mobile */
    }
    
    .resize-n, .resize-s {
      height: 8px;
    }
    
    .resize-e, .resize-w {
      width: 8px;
    }
    
    .resize-ne, .resize-nw, .resize-se, .resize-sw {
      width: 16px;
      height: 16px;
    }
  }
</style>