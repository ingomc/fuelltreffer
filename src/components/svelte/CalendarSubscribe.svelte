<script>
  import { CURRENT_LEAGUE } from '../../config/league';
  import { getCalendarDevice } from '../../utils/calendar-device';
  import CalendarOption from './CalendarOption.svelte';
  export let participantId;
  let dialog;
  let address = '';
  let copied = false;
  let device = 'unknown';
  let showGoogle = false;
  let alternativesOpen = false;
  $: primaryOptions = device === 'unknown' ? ['google', 'apple'] : [device === 'android' ? 'google' : 'apple'];
  $: team = CURRENT_LEAGUE.teams.find(team => team.id === String(participantId));
  function open() {
    address = new URL(`/api/calendar/${CURRENT_LEAGUE.eventId}/${participantId}.ics`, window.location.origin).href;
    copied = false;
    device = getCalendarDevice(navigator.userAgent, navigator.platform, navigator.maxTouchPoints);
    showGoogle = false;
    alternativesOpen = false;
    dialog.showModal();
  }
  async function copy() {
    try { await navigator.clipboard.writeText(address); copied = true; }
    catch { copied = false; dialog.querySelector('input')?.select(); }
  }
</script>

{#if team}
  <div class="mb-3 flex flex-wrap items-center justify-between gap-2">
    <span class="text-xs text-gray-600 dark:text-gray-400">{team.shortName} · Saison {CURRENT_LEAGUE.season}</span>
    <button type="button" on:click={open} class="rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500">📅 Spielplan abonnieren</button>
  </div>
  <dialog bind:this={dialog} aria-labelledby="calendar-title" class="w-[calc(100%-2rem)] max-w-lg rounded-xl border border-gray-200 bg-white p-5 text-gray-900 shadow-xl backdrop:bg-black/50 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-100">
    <div class="mb-4 flex items-start justify-between gap-3">
      <h2 id="calendar-title" class="text-lg font-bold">Spielplan abonnieren</h2>
      <button type="button" aria-label="Dialog schließen" on:click={() => dialog.close()} class="rounded px-2 py-1 hover:bg-gray-100 dark:hover:bg-gray-800">✕</button>
    </div>
    <p class="mb-4 font-medium">{team.shortName} · Saison {CURRENT_LEAGUE.season}</p>
    <div class="mb-4 grid gap-2 sm:grid-cols-2">
      {#each primaryOptions as provider}
        <CalendarOption {provider} {address} onGoogle={() => showGoogle = true} expanded={showGoogle} />
      {/each}
    </div>
    {#if device !== 'unknown'}
      <details bind:open={alternativesOpen} class="mb-4">
        <summary class="cursor-pointer rounded text-sm text-blue-700 dark:text-blue-300">Anderen Kalender verwenden</summary>
        <div class="mt-3">
          <CalendarOption provider={device === 'android' ? 'apple' : 'google'} {address} onGoogle={() => showGoogle = true} expanded={showGoogle} />
        </div>
      </details>
    {/if}
    <section id="google-calendar-help" hidden={!showGoogle} aria-label="Google Kalender abonnieren" class="mb-4 rounded-md bg-gray-100 p-3 text-sm dark:bg-gray-800">
      <p class="font-semibold">In Google Kalender abonnieren</p>
      <ol class="my-2 list-decimal space-y-1 pl-5">
        <li>Die Kalenderadresse unten kopieren.</li>
        <li>Google Kalender am Computer öffnen und das Google-Konto vom Handy verwenden.</li>
        <li>Unter „Weitere Kalender → + → Per URL“ die Adresse einfügen und hinzufügen.</li>
      </ol>
      <a href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl" target="_blank" rel="noopener noreferrer" class="inline-block py-2 text-blue-700 underline dark:text-blue-300">Google Kalender im Browser öffnen (neuer Tab)</a>
      <p class="mt-2">In der Google-Kalender-App kann dieses Abo nicht direkt eingerichtet werden. Auf dem Handy kannst du im Browser „Desktopwebsite“ versuchen; falls das nicht klappt, verwende einen Computer. Anschließend den Kalender in der App mit demselben Konto einblenden.</p>
    </section>
    <label for="calendar-address" class="mb-1 block text-sm">Kalenderadresse</label>
    <input id="calendar-address" readonly value={address} on:focus={(event) => event.currentTarget.select()} class="w-full rounded border border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
    <button type="button" on:click={copy} class="my-2 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">Kalenderadresse kopieren</button>
    <p aria-live="polite" class="text-sm">{copied ? 'Kalenderadresse kopiert.' : ''}</p>
    <div class="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-300">
      <p>Outlook: „Kalender hinzufügen → Aus dem Internet abonnieren“ und die Adresse einfügen.</p>
      <p>Bitte abonnieren: Ein einmaliger Dateiimport aktualisiert sich nicht automatisch. Wir laden Änderungen alle sechs Stunden; zusätzlich gilt das Abrufintervall deiner Kalender-App.</p>
      <p>Dieses Abo gilt nur für Saison {CURRENT_LEAGUE.season}. Spiele sind mit vier Stunden geschätzter Dauer eingetragen.</p>
    </div>
  </dialog>
{/if}
