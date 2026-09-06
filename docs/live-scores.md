# Live-Scores im Spielbericht

Auf `/match/:eventId/:matchId/report` erscheint „Live am Board“, sobald der
3K-Dartsscorer ein zugehöriges Einzel oder Doppel überträgt. Zwei Karten zeigen
Restpunkte, letzte Aufnahme, Darts im aktuellen Leg, den 3-Dart-Average und Legs.
Der Spieler am Wurf erhält einen Rahmen; mögliche Checkouts sind grün. Auf dem
Handy stehen die Boards untereinander. Die tatsächlichen Board-Nummern bleiben
erhalten, auch wenn vor Ort z. B. Board 3 und 4 verwendet werden.

## Zuordnung und Datenquelle

Die öffentliche Anbindung wurde am 06.09.2026 anhand der
[3K-Live-Seite](https://live.3k-darts.com/event/2/27726), ihres ausgelieferten
JavaScripts und einer laufenden Mannschaftsbegegnung geprüft. Das
[Liga-Portal](https://portal.3k-darts.com/frontend/events/5/event/24970/phase/42062/group/395593)
zeigt den Live-Button im Dialog der jeweiligen Begegnung.

- `dbId` aus dem Spielbericht entspricht der Datenbank im Portal-Link. Bei
  unserer Liga ist das `5`, obwohl der API-Hostname `backend4` enthält.
- Bei Ligaspielen ist die Live-`groupKey` die ID der Mannschaftsbegegnung,
  **nicht** die Liga-, Phasen- oder Spieltags-ID. Für Spiel `3876204` lautet der
  Link beispielsweise `https://live.3k-darts.com/event/5/3876204`.
- Snapshot: `https://live.3k-darts.com/dartsscorer-liveticker/api/v1/match/5/0/3876204`.
- SockJS-Endpunkt: `https://live.3k-darts.com/dartsscorer-liveticker/api/v1/websocket`.
  Der STOMP-Client abonniert `/topic/5-3876204`. WebSocket wird bevorzugt;
  SockJS unterstützt außerdem die HTTP-Transporte des Anbieters.
- Zusätzlich werden Datenbank, Begegnung und `matchKey` gegen die **Einzelspiel-IDs
  im angeforderten Spielbericht** geprüft. Vorhandene `originalEventId` und
  `teamParentMatchId` müssen ebenfalls passen. Spielernamen oder Board-Nummern
  werden nicht zur Zuordnung benutzt.

Der lokale `/api/match/:eventId/:matchId/live`-Proxy ermittelt diese Angaben aus
dem vorhandenen, über `TWOK_SOFTWARE_API_URL` konfigurierten Backend und liefert
nur die benötigten Score-Felder. Es sind keine zusätzlichen Zugangsdaten oder
Umgebungsvariablen nötig. Die öffentliche 3K-Anbindung ist keine versionierte
Vertragsgarantie; Änderungen des Anbieters können eine Anpassung erfordern.

## Aktualisierung und Ausfälle

Vollständige `match`-Nachrichten ersetzen den Board-Stand. `matchPlayer`-Nachrichten
zeigen eine gerade erfasste Einzel-Dart-Aufnahme; die verbindlichen Restpunkte
kommen mit dem nächsten vollständigen Stand. Status `2` beendet ein Board-Spiel,
Status `4` entfernt es. Ältere Nachrichten überschreiben keine neueren Stände.

Beim Verbinden, nach Wiederverbindung und alle 30 Sekunden wird der Snapshot
abgeglichen. Ein währenddessen empfangener Wurf hat Vorrang vor einem langsameren
HTTP-Ergebnis. Nach Änderungen an Legs oder Spielstatus lädt der Spielbericht
seine Ergebnisse und die betroffenen Statistiken nach. Führungen in noch laufenden
Einzelspielen zählen dabei nicht als gewonnene Mannschaftspunkte.

Bei Unterbrechungen bleibt der letzte Stand sichtbar und ist als solcher markiert.
Der Client verbindet nach fünf Sekunden erneut; HTTP-Fehler werden automatisch
erneut geprüft. In ausgeblendeten Tabs sowie beim Verlassen der Seite werden
Verbindung, Timer und laufende Client-Anfragen beendet. Vollständig beendete
Spielberichte öffnen keine Live-Verbindung. Offene Begegnungen ohne Live-Boards
zeigen keine leeren Karten; ein späterer Spielbeginn wird trotzdem erkannt.

## Prüfung

### Lokale Vorschau ohne laufendes Ligaspiel

`npm run dev` starten und
[Live-Boards testen](http://127.0.0.1:4000/dev/live-scores) öffnen. Die Seite zeigt
zwei Boards mit ausdrücklich gekennzeichneten Beispielspielern. Alle drei Sekunden
werden Aufnahmen, Restpunkte, Average, Anwurf und Legs aktualisiert. Die Schalter
testen eine zusätzliche Aufnahme, Verbindungsabbruch und Wiederverbindung, ein
beendetes Board sowie das Ende der ganzen Begegnung. „Neu starten“ setzt die
Vorschau zurück. Bei einem ausgeblendeten Tab pausiert die Simulation.

Die Vorschau verwendet die echten Board-Komponenten und die Verarbeitung der
Score-Nachrichten, simuliert aber die Datenquelle. Sie öffnet keine Verbindung zu
3K Darts. Die Route liefert im Produktionsbetrieb 404; die Beispieldaten werden
durch einen nur im Dev-Modus erreichbaren Import aus dem Produktionsbundle entfernt.
Für einen echten Verbindungstest muss die konkrete Begegnung im 3K-Dartsscorer
laufen; anschließend ihren normalen Spielbericht öffnen.

### Dev-Server und Browser-Cache

Vite ermittelt Host und Port seiner Entwicklungsverbindung automatisch. SockJS
bekommt beim Optimieren der Browser-Abhängigkeiten `globalThis` statt des
Node-spezifischen `global`. Dev-Antworten verwenden `Cache-Control: no-store`.
Die zusätzlichen Browser-Abhängigkeiten werden schon vor dem ersten Seitenaufruf
vorbereitet, damit gemeinsam verwendete Module konsistente Import-URLs erhalten.
Nach einer älteren Version mit gecachten Modulen einmal ohne Cache neu laden.
Alternativ mit `FRONTEND_PORT=4100 npm run dev` einen frischen lokalen Port verwenden
und `http://127.0.0.1:4100/dev/live-scores` öffnen. Nach einem parallel gelaufenen
Build den Dev-Server neu starten, falls Vite „Outdated Optimize Dep“ meldet.

### Automatisierte Prüfungen

`npm test` enthält Prüfungen für die exakte Zuordnung, API-Fehler, fehlende Daten,
Null-Aufnahmen, einzelne Darts, Board-Wechsel, Spielende, Wiederverbindung,
überholte HTTP-Antworten und das Beenden der Verbindung. `npm run lint` und
`npm run build` prüfen die Integration. Browserprüfungen verwenden für zwei
Boards synthetische Spieler; Testdaten werden nicht in der Produktionsanwendung
ausgeliefert. Die echte Liga ist zum Prüfzeitpunkt noch
nicht live; der tatsächliche Datenempfang wurde zusätzlich am öffentlichen
Referenz-Feed geprüft.
