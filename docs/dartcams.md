# SCO Dartcams: automatische Spielauswahl

`GET /api/dartcams/context` liefert öffentliche Spiel- und Logo-Metadaten für die statische Dartcams-Webapp. Live-Scores bleiben beim bestehenden 3K-Liveticker; der Endpunkt überträgt keine Kamerabilder und benötigt keine Anmeldung.

## Datenquellen

- Spielplan: `${TWOK_SOFTWARE_API_URL}/participant/${CURRENT_LEAGUE.defaultParticipantId}`. Saison, Mannschaft und Datenbank-ID stammen aus `src/config/league.ts`.
- Logos: `${DARTSTORY_URL}/api/state`, standardmäßig `https://dartstory.ingomc.de`. Die Zuordnung erfolgt ausschließlich über `threeKParticipantId`, nicht über Teamnamen. Relative Upload-Pfade werden zu absoluten HTTPS-URLs derselben Dartstory-Domain.
- Kein neuer Datenspeicher und keine doppelte Logo-Pflege: Logos bleiben in Dartstory, Spielplandaten in 3K.

## Vertrag (Version 1)

```json
{
  "version": 1,
  "fetchedAt": "2026-10-15T12:00:00.000Z",
  "stale": false,
  "logosStale": false,
  "fixture": {
    "matchId": 3876210,
    "eventId": 24970,
    "databaseId": 5,
    "roundName": "Spieltag 4",
    "datePlanned": "2026-10-16T16:00:00.000Z",
    "status": "upcoming",
    "liveUrl": "https://live.3k-darts.com/event/5/3876210",
    "home": { "participantId": 633505, "name": "SCO-Darts Team Fülltreffer", "logoUrl": "https://dartstory.ingomc.de/logo_sco.png" },
    "guest": { "participantId": 632080, "name": "Drächer Bull’s Eichen", "logoUrl": null }
  }
}
```

`fixture` ist `null`, wenn kein passendes Spiel existiert; `logoUrl` darf fehlen (`null`). `status` ist `live`, `upcoming` oder `finished`.

## Auswahl und Aktualisierung

1. Abgesagte, verschobene, inaktive Spiele, Freilose und fremde Teams/Saisons werden ausgeschlossen.
2. Ein begonnenes, noch nicht abgeschlossenes Spiel vom heutigen Berliner Kalendertag oder innerhalb der letzten zwölf Stunden wird bevorzugt; ein aktiver Live-Status hat Vorrang. So funktioniert auch ein Spiel nach Mitternacht. `active: true` allein bedeutet nicht, dass ein Spiel gerade läuft.
3. Andernfalls wird das nächste noch offene Spiel nach Datum gewählt. Ein wochenlang nicht abgeschlossener Alttermin blockiert die Auswahl nicht.
4. `?match=3876210` hält ein bereits ausgewähltes Spiel fest, auch nach Abschluss. Die ID muss zum eigenen Saison-Spielplan gehören. Dartcams verwendet diesen Parameter bei den minütlichen Aktualisierungen, damit der Endstand sichtbar bleibt. Ein Neustart oder ausdrückliches Aktualisieren wählt neu.

Der Server bündelt parallele Anfragen. Spielplandaten werden für 60 Sekunden, Logos für fünf Minuten zwischengespeichert; nach Logo-Fehlern erfolgt ein neuer Versuch nach 60 Sekunden. Zeitlimits: acht Sekunden für 3K, 2,5 Sekunden für Dartstory. Fehler erhalten den letzten erfolgreichen Stand und setzen die jeweiligen `stale`-Flags. Ohne jemals erfolgreich geladenen Spielplan antwortet der Endpunkt mit 502; ungültige `match`-Parameter erhalten 400. Ein Logo-Ausfall blockiert die Spielauswahl nicht.

Browser dürfen die öffentlichen Daten ohne Cookies lesen (`Access-Control-Allow-Origin: *`, GET/OPTIONS). Erfolgreiche, frische Antworten sind 30 Sekunden HTTP-cachebar; Fehler und veraltete Antworten verwenden `no-store`. Andere APIs und Schreibzugriffe bekommen dadurch keine zusätzlichen Rechte.

## Inbetriebnahme

Fülltreffer mit diesem Endpunkt vor Dartcams veröffentlichen. Die vorhandene 3K-Konfiguration reicht; `DARTSTORY_URL` ist optional und nur für eine andere Logo-Quelle nötig. Für lokale Integration kann Dartcams mit `VITE_DARTCAMS_CONTEXT_URL=http://localhost:4000/api/dartcams/context` gestartet werden. Diese Vite-Variable ist öffentlich und wird beim Build fest eingebunden.

Prüfung: `npm test` deckt Auswahl, Mitternacht, feste Spiel-ID, Logo-Zuordnung, Caching, Ausfälle und CORS ab; anschließend `npm run lint` und `npm run build`.
