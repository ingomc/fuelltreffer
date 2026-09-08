<script>
  import { CURRENT_LEAGUE } from '../../config/league';
  export let participantId;
  let dialog;
  let address = '';
  let copied = false;
  $: team = CURRENT_LEAGUE.teams.find(team => team.id === String(participantId));
  function open() {
    address = new URL(`/api/calendar/${CURRENT_LEAGUE.eventId}/${participantId}.ics`, window.location.origin).href;
    copied = false;
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
    <a href={address.replace(/^https?:/, 'webcal:')} class="mb-4 inline-block rounded-md bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">In Kalender-App öffnen</a>
    <label for="calendar-address" class="mb-1 block text-sm">Kalenderadresse</label>
    <input id="calendar-address" readonly value={address} on:focus={(event) => event.currentTarget.select()} class="w-full rounded border border-gray-300 bg-gray-50 p-2 text-sm dark:border-gray-600 dark:bg-gray-800" />
    <button type="button" on:click={copy} class="my-2 rounded border border-gray-300 px-3 py-2 text-sm dark:border-gray-600">Kalenderadresse kopieren</button>
    <p aria-live="polite" class="text-sm">{copied ? 'Kalenderadresse kopiert.' : ''}</p>
    <div class="mt-3 space-y-3 text-sm text-gray-600 dark:text-gray-300">
      <p>Google Kalender: Am Computer unter „Weitere Kalender → Per URL“ hinzufügen. Outlook: „Kalender hinzufügen → Aus dem Internet abonnieren“ und die Adresse einfügen.</p>
      <p>Bitte abonnieren: Ein einmaliger Dateiimport aktualisiert sich nicht automatisch. Wir laden Änderungen alle sechs Stunden; zusätzlich gilt das Abrufintervall deiner Kalender-App.</p>
      <p>Dieses Abo gilt nur für Saison {CURRENT_LEAGUE.season}. Spiele sind mit vier Stunden geschätzter Dauer eingetragen.</p>
    </div>
  </dialog>
{/if}
