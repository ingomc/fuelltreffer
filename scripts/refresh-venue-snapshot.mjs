import { writeFile } from 'node:fs/promises';
import { CURRENT_LEAGUE } from '../src/config/league.ts';
import { parseParticipant } from '../src/lib/venue-data.ts';

// Manual maintenance only. Do not attach this to a build or deploy hook.
const baseUrl = process.env.TWOK_SOFTWARE_API_URL || CURRENT_LEAGUE.api.twokSoftwareBaseUrl;
const teams = [];
for (const team of CURRENT_LEAGUE.teams) {
  const response = await fetch(`${baseUrl.replace(/\/$/, '')}/participant/${team.id}`, {
    signal: AbortSignal.timeout(8000),
    headers: { 'User-Agent': 'Fuelltreffer-Spielorte/1.0 (+https://darts.sc-oberfuellbach.de)' },
  });
  if (!response.ok) throw new Error(`${team.name}: HTTP ${response.status}; gespeicherter Datenstand bleibt unverändert.`);
  teams.push(parseParticipant(await response.json(), team));
}

// Publish only after every request succeeded. parseParticipant strips personal data.
await writeFile(new URL('../src/data/venues.snapshot.json', import.meta.url), JSON.stringify({
  updatedAt: new Date().toISOString().slice(0, 10), teams,
}, null, 2) + '\n');
console.log(`${teams.length} Spielorte gespeichert. Adressen und Koordinaten vor dem Commit prüfen.`);
