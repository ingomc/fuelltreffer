<script>
  import { createEventDispatcher } from 'svelte';
  
  const dispatch = createEventDispatcher();
  
  let email = '';
  let password = '';
  let isLoading = false;
  let error = '';

  async function handleLogin(event) {
    event.preventDefault();
    
    if (!email.trim() || !password.trim()) {
      error = 'Bitte Email und Passwort eingeben';
      return;
    }

    isLoading = true;
    error = '';

    try {
      const response = await fetch('/api/auth', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        dispatch('authenticated');
        // Reload page to show authenticated content
        window.location.reload();
      } else {
        error = data.error || 'Login fehlgeschlagen';
      }
    } catch (err) {
      error = 'Verbindungsfehler';
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="max-w-md mx-auto mt-8 bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
  <div class="text-center mb-6">
    <h1 class="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
      🔐 Streamer-Zugang
    </h1>
    <p class="text-gray-600 dark:text-gray-400">
      Anmeldung erforderlich für Live-Streaming
    </p>
  </div>

  <form on:submit={handleLogin}>
    <div class="mb-4">
      <label for="email" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Email
      </label>
      <input 
        id="email"
        type="email" 
        bind:value={email}
        disabled={isLoading}
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-600"
        placeholder="admin@fuelltreffer.de"
      />
    </div>

    <div class="mb-6">
      <label for="password" class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
        Passwort
      </label>
      <input 
        id="password"
        type="password" 
        bind:value={password}
        disabled={isLoading}
        required
        class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 disabled:bg-gray-100 dark:disabled:bg-gray-600"
        placeholder="••••••••••••"
      />
    </div>

    {#if error}
      <div class="mb-4 p-3 bg-red-100 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-md text-sm">
        ❌ {error}
      </div>
    {/if}

    <button 
      type="submit"
      disabled={isLoading}
      class="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-md font-medium transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
    >
      {isLoading ? '🔄 Anmelden...' : '🚀 Anmelden'}
    </button>
  </form>

  <div class="mt-6 p-3 bg-yellow-100 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
    <h3 class="text-sm font-medium text-yellow-800 dark:text-yellow-200 mb-1">ℹ️ Info</h3>
    <p class="text-xs text-yellow-700 dark:text-yellow-300">
      Diese Seite ist nur für autorisierte Streamer zugänglich. Die Anmeldedaten findest du in der Projektkonfiguration.
    </p>
  </div>
</div>