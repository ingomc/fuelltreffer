<script>
  import { CURRENT_LEAGUE } from '../../config/league';
  import { getCalendarDevice } from '../../utils/calendar-device';
  import CalendarOption from './CalendarOption.svelte';
  import Icon from './Icon.svelte';
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
  <button type="button" on:click={open} class="btn-primary">
    <Icon name="calendar-plus" size={16} />
    Spielplan abonnieren
  </button>
  <dialog bind:this={dialog} aria-labelledby="calendar-title" class="w-[calc(100%-2rem)] max-w-lg rounded-3xl border border-zinc-200 bg-white p-0 text-zinc-900 shadow-2xl backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm dark:border-white/10 dark:bg-zinc-900 dark:text-zinc-100">
    <div class="flex items-start justify-between gap-3 border-b border-zinc-100 p-5 dark:border-white/[0.06]">
      <div class="flex items-center gap-3">
        <span class="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
          <Icon name="calendar-plus" size={20} />
        </span>
        <div>
          <h2 id="calendar-title" class="font-display text-lg font-semibold">Spielplan abonnieren</h2>
          <p class="text-sm text-zinc-500 dark:text-zinc-400">{team.shortName} · Saison {CURRENT_LEAGUE.season}</p>
        </div>
      </div>
      <button type="button" aria-label="Dialog schließen" on:click={() => dialog.close()} class="btn-ghost h-9 w-9 p-0">
        <Icon name="x" size={18} />
      </button>
    </div>
    <div class="max-h-[70vh] overflow-y-auto p-5">
      <div class="mb-4 grid gap-2 sm:grid-cols-2">
        {#each primaryOptions as provider}
          <CalendarOption {provider} {address} onGoogle={() => showGoogle = true} expanded={showGoogle} />
        {/each}
      </div>
      {#if device !== 'unknown'}
        <details bind:open={alternativesOpen} class="mb-4">
          <summary class="link cursor-pointer text-sm">Anderen Kalender verwenden</summary>
          <div class="mt-3">
            <CalendarOption provider={device === 'android' ? 'apple' : 'google'} {address} onGoogle={() => showGoogle = true} expanded={showGoogle} />
          </div>
        </details>
      {/if}
      <section id="google-calendar-help" hidden={!showGoogle} aria-label="Google Kalender abonnieren" class="mb-4 rounded-2xl bg-zinc-50 p-4 text-sm dark:bg-white/5">
        <p class="font-semibold">In Google Kalender abonnieren</p>
        <ol class="my-2 list-decimal space-y-1 pl-5 text-zinc-600 dark:text-zinc-300">
          <li>Die Kalenderadresse unten kopieren.</li>
          <li>Google Kalender am Computer öffnen und das Google-Konto vom Handy verwenden.</li>
          <li>Unter „Weitere Kalender → + → Per URL“ die Adresse einfügen und hinzufügen.</li>
        </ol>
        <a href="https://calendar.google.com/calendar/u/0/r/settings/addbyurl" target="_blank" rel="noopener noreferrer" class="link inline-block py-2">Google Kalender im Browser öffnen (neuer Tab)</a>
        <p class="mt-2 text-zinc-600 dark:text-zinc-300">In der Google-Kalender-App kann dieses Abo nicht direkt eingerichtet werden. Auf dem Handy kannst du im Browser „Desktopwebsite“ versuchen; falls das nicht klappt, verwende einen Computer. Anschließend den Kalender in der App mit demselben Konto einblenden.</p>
      </section>
      <label for="calendar-address" class="eyebrow mb-1.5 block">Kalenderadresse</label>
      <div class="flex gap-2">
        <input id="calendar-address" readonly value={address} on:focus={(event) => event.currentTarget.select()} class="min-w-0 flex-1 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs dark:border-white/10 dark:bg-white/5" />
        <button type="button" on:click={copy} class="btn-secondary shrink-0">
          <Icon name={copied ? 'check' : 'copy'} size={15} />
          <span>{copied ? 'Kopiert' : 'Kopieren'}</span>
        </button>
      </div>
      <p aria-live="polite" class="sr-only">{copied ? 'Kalenderadresse kopiert.' : ''}</p>
      <div class="mt-4 space-y-2 text-sm text-zinc-500 dark:text-zinc-400">
        <p>Outlook: „Kalender hinzufügen → Aus dem Internet abonnieren“ und die Adresse einfügen.</p>
        <p>Bitte abonnieren: Ein einmaliger Dateiimport aktualisiert sich nicht automatisch. Wir laden Änderungen alle sechs Stunden; zusätzlich gilt das Abrufintervall deiner Kalender-App.</p>
        <p>Dieses Abo gilt nur für Saison {CURRENT_LEAGUE.season}. Spiele sind mit vier Stunden geschätzter Dauer eingetragen.</p>
      </div>
    </div>
  </dialog>
{/if}
