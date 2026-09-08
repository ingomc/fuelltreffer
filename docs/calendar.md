# Saisonkalender

Der Abo-Button steht oberhalb der Spielplanliste. Öffentliche Feeds liegen unter
`/api/calendar/{eventId}/{participantId}.ics`. Die Zuordnung kommt aus
`CURRENT_LEAGUE`; beim Saisonwechsel erhalten Kalender neue URLs. Alte URLs
liefern 404 und werden niemals auf neue Saisontermine umgeleitet.

Produktion mit `node scripts/server.mjs` starten (auch Docker verwendet diesen
Launcher). Er aktiviert den Kalenderworker beim Laden der Astro-Middleware,
ohne auf Requests zu warten. Entwicklung startet ihn ebenfalls; Builds nicht.
Direktes Starten von `dist/server/entry.mjs` aktiviert den Worker nicht.

Ein Serverprozess lädt beim Start und alle sechs Stunden die zehn Teilnehmer,
mit maximal zwei parallelen Anfragen und acht Sekunden Timeout. Requests lesen
nur den Speicher. Neustarts leeren den Cache; bis zum ersten erfolgreichen
Durchlauf antwortet der Feed mit 503. Fehler behalten vorhandene Daten.
Mehrere Serverinstanzen würden jeweils einen eigenen Worker starten.

Spielorte stammen aus den Antworten der Heimteams, einschließlich U18,
Rauchen, Barrierefreiheit und Boardanzahl. Fehlende Angaben werden nicht als
Nein interpretiert. Kalender-Apps bestimmen ihren eigenen Abrufrhythmus.

Nach Deployment: Feed abonnieren, Ort und Terminzeit in einer Kalender-App
prüfen und bei einer späteren Terminänderung dieselbe UID sowie die Übernahme
im Abo bestätigen. Ein Dateiimport ist kein Abo.
