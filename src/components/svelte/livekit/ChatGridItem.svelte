<script>
  import ChatWidget from './ChatWidget.svelte';
</script>

<div class="chat-grid-item">
  <ChatWidget />
</div>

<style>
  .chat-grid-item {
    width: 100%;
    height: 100%;
    border-radius: 8px;
    overflow: hidden;
    background: rgba(255, 255, 255, 0.02);
  }
  
  /* Ensure the ChatWidget fills the container */
  .chat-grid-item :global(.chat-widget) {
    height: 100%;
    border-radius: 8px;
  }
</style>