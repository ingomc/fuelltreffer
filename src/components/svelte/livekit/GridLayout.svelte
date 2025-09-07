<script>
  import { onMount } from 'svelte';
  import GridItem from './GridItem.svelte';
  import { 
    gridConfig, 
    gridItems, 
    layoutTemplates,
    initializeLayoutManager,
    updateGridItem,
    findNearestValidPosition,
    applyTemplate
  } from './utils/layout-manager.js';
  
  // Props for the components to render in grid items
  export let cameraComponent = null;
  export let screenshareComponent = null; 
  export let chatComponent = null;
  
  // Props for binding video elements
  export let localVideo = null;
  export let noCameraDiv = null;
  export let screenShareVideo = null;
  
  let gridContainer;
  let showLayoutMenu = false;
  
  onMount(() => {
    initializeLayoutManager();
  });
  
  // Handle drag movement - update item position temporarily for preview
  function handleDragMove(event) {
    const { id, x, y, width, height } = event.detail;
    updateGridItem(id, { x, y, width, height });
  }
  
  // Handle drag end - find valid position and update
  function handleDragEnd(event) {
    const { id } = event.detail;
    const item = $gridItems.find(i => i.id === id);
    if (!item) return;
    
    // Find nearest valid position
    const validPosition = findNearestValidPosition(id, item.x, item.y, item.width, item.height);
    
    // Update with valid position
    updateGridItem(id, validPosition);
    
    console.log(`📍 Moved ${id} to position (${validPosition.x}, ${validPosition.y})`);
  }
  
  // Handle resize - update item size
  function handleResize(event) {
    const { id, x, y, width, height } = event.detail;
    
    // Find valid position for the new size
    const validPosition = findNearestValidPosition(id, x, y, width, height);
    const validSize = { width, height };
    
    // Update with valid position and size
    updateGridItem(id, { ...validPosition, ...validSize });
  }
  
  // Handle resize end
  function handleResizeEnd(event) {
    const { id } = event.detail;
    console.log(`📏 Resized ${id}`);
  }
  
  // Apply template
  function selectTemplate(templateName) {
    applyTemplate(templateName);
    showLayoutMenu = false;
    console.log(`🎨 Applied ${templateName} template`);
  }
  
  // Toggle layout menu
  function toggleLayoutMenu() {
    showLayoutMenu = !showLayoutMenu;
  }
</script>

<!-- Layout Controls -->
<div class="grid-layout-controls">
  <div class="layout-menu-container">
    <button 
      class="layout-menu-button"
      on:click={toggleLayoutMenu}
      title="Layout-Templates"
    >
      🎛️ Layout
    </button>
    
    {#if showLayoutMenu}
      <div class="layout-menu">
        <div class="layout-menu-header">Layout Templates</div>
        
        {#each Object.keys(layoutTemplates) as templateName}
          <button 
            class="template-button"
            on:click={() => selectTemplate(templateName)}
          >
            {#if templateName === 'default'}
              📐 Standard
            {:else if templateName === 'fullCamera'}
              📹 Kamera Focus
            {:else if templateName === 'fullScreenshare'}
              🖥️ Bildschirm Focus  
            {:else if templateName === 'chatFocus'}
              💬 Chat Focus
            {:else}
              {templateName}
            {/if}
          </button>
        {/each}
        
        <div class="layout-menu-divider"></div>
        <div class="layout-menu-info">
          💡 Ziehe Elemente zum Verschieben<br>
          🔧 Nutze die Ränder zum Größe ändern
        </div>
      </div>
    {/if}
  </div>
</div>

<!-- Grid Container -->
<div 
  bind:this={gridContainer}
  class="grid-layout"
  style="
    display: grid;
    grid-template-columns: repeat({$gridConfig.columns}, 1fr);
    grid-template-rows: repeat({$gridConfig.rows}, 1fr);
    gap: {$gridConfig.gap}px;
    width: 100%;
    height: 600px;
    min-height: 400px;
    max-height: 80vh;
  "
>
  {#each $gridItems as item (item.id)}
    <GridItem 
      id={item.id}
      title={item.title}
      type={item.type}
      x={item.x}
      y={item.y}
      width={item.width}
      height={item.height}
      minWidth={item.minWidth}
      minHeight={item.minHeight}
      on:dragMove={handleDragMove}
      on:dragEnd={handleDragEnd}
      on:resize={handleResize}
      on:resizeEnd={handleResizeEnd}
    >
      <!-- Render appropriate component based on item type -->
      {#if item.id === 'camera'}
        {#if cameraComponent}
          <svelte:component this={cameraComponent} bind:localVideo bind:noCameraDiv />
        {:else}
          <div class="placeholder">
            <div class="placeholder-icon">📹</div>
            <div class="placeholder-text">Kamera</div>
          </div>
        {/if}
      {:else if item.id === 'screenshare'}
        {#if screenshareComponent}
          <svelte:component this={screenshareComponent} bind:screenShareVideo />
        {:else}
          <div class="placeholder">
            <div class="placeholder-icon">🖥️</div>
            <div class="placeholder-text">Bildschirm teilen</div>
          </div>
        {/if}
      {:else if item.id === 'chat'}
        {#if chatComponent}
          <svelte:component this={chatComponent} />
        {:else}
          <div class="placeholder">
            <div class="placeholder-icon">💬</div>
            <div class="placeholder-text">Chat</div>
          </div>
        {/if}
      {/if}
    </GridItem>
  {/each}
</div>

<style>
  .grid-layout-controls {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
    position: relative;
  }
  
  .layout-menu-container {
    position: relative;
  }
  
  .layout-menu-button {
    background: rgba(59, 130, 246, 0.1);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 8px 16px;
    color: rgba(255, 255, 255, 0.9);
    font-size: 0.9rem;
    cursor: pointer;
    transition: all 0.2s ease;
  }
  
  .layout-menu-button:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.5);
  }
  
  .layout-menu {
    position: absolute;
    top: 100%;
    right: 0;
    margin-top: 8px;
    background: rgba(0, 0, 0, 0.9);
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 12px;
    padding: 16px;
    min-width: 220px;
    z-index: 1000;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
  }
  
  .layout-menu-header {
    color: rgba(255, 255, 255, 0.9);
    font-weight: 600;
    margin-bottom: 12px;
    font-size: 0.95rem;
  }
  
  .template-button {
    display: block;
    width: 100%;
    background: rgba(255, 255, 255, 0.05);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    padding: 8px 12px;
    color: rgba(255, 255, 255, 0.8);
    font-size: 0.85rem;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    margin-bottom: 4px;
  }
  
  .template-button:hover {
    background: rgba(59, 130, 246, 0.2);
    border-color: rgba(59, 130, 246, 0.4);
    color: rgba(255, 255, 255, 0.95);
  }
  
  .layout-menu-divider {
    height: 1px;
    background: rgba(255, 255, 255, 0.1);
    margin: 12px 0;
  }
  
  .layout-menu-info {
    color: rgba(255, 255, 255, 0.6);
    font-size: 0.75rem;
    line-height: 1.4;
  }
  
  .grid-layout {
    position: relative;
    background: rgba(0, 0, 0, 0.05);
    border: 2px dashed rgba(255, 255, 255, 0.1);
    border-radius: 16px;
    padding: 12px;
    resize: vertical;
    overflow: hidden;
  }
  
  .placeholder {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: rgba(255, 255, 255, 0.6);
    text-align: center;
  }
  
  .placeholder-icon {
    font-size: 2.5rem;
    margin-bottom: 8px;
    opacity: 0.7;
  }
  
  .placeholder-text {
    font-size: 0.9rem;
    font-weight: 500;
    opacity: 0.8;
  }
  
  /* Responsive adjustments */
  @media (max-width: 1200px) {
    .grid-layout {
      height: 500px;
    }
  }
  
  @media (max-width: 768px) {
    .grid-layout {
      height: 400px;
      padding: 8px;
    }
    
    .layout-menu {
      right: -16px;
      min-width: 200px;
    }
    
    .layout-menu-button {
      padding: 6px 12px;
      font-size: 0.85rem;
    }
  }
</style>