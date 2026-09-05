# Spielortkarte pflegen

`/spielorte` wird trotz SSR mit `prerender = true` beim Build erzeugt. Die Seite fragt direkt die zehn Teilnehmer aus `src/config/league.ts` ab. Sie veröffentlicht nur Team-ID/-Name und Spielort-ID/-Name/Adresse. Leaflet 1.9.4 erhält fertige Markerdaten aus dem HTML; im Browser gibt es keine 2k- oder Geocoding-Abfragen. Die vorhandenen Google-Maps-Links auf dem Dashboard bleiben erhalten.

## Datenstand aktualisieren

- `src/data/venues.snapshot.json`: geprüfter Ersatz für fehlgeschlagene Teilnehmerabfragen, einzeln je Team. Builds warnen bei Ausfällen und fehlenden Koordinaten, laufen aber weiter.
- `src/data/venue-locations.json`: dauerhaft gespeicherte Koordinaten mit OSM-Quellenlink, Spielort-ID und normalisierter Adresse.
- `scripts/data/nominatim-cache.json`: Ergebnisse der einmaligen Ortsauflösung vom 05.09.2026, einschließlich leerer und verworfener Treffer. Keine automatische Nutzung bei Builds.

Für einen Saisonwechsel zuerst `CURRENT_LEAGUE` aktualisieren. Danach mit Node.js 22.6+ und erreichbarer API den Ersatzdatenstand erneuern:

```sh
node --experimental-strip-types scripts/refresh-venue-snapshot.mjs
npm test
npm run lint
npm run build
```

Das Wartungsskript speichert erst, wenn alle Teilnehmerabfragen erfolgreich waren. Den Diff einschließlich Adressen vor dem Commit prüfen. Ein Build aktualisiert ausschließlich sein HTML, nicht den versionierten Ersatzdatenstand. `TWOK_SOFTWARE_API_URL` kann für Wartung und Build gesetzt werden; reine Container-Laufzeitvariablen ändern die statische Seite nicht.

## Koordinaten prüfen

Adressen werden mit Unicode-NFKC, Kleinschreibung und vereinheitlichten Leerzeichen normalisiert; Straße, PLZ und Ort bilden den Schlüssel. Neue Adressen oder Spielort-IDs übernehmen keine alten Koordinaten. Bis zur Prüfung bleiben Team, Adresse und OSM-Suchlink sichtbar, ohne Marker.

Neue Standorte bewusst einzeln auflösen, vorhandene Cache-Ergebnisse zuerst verwenden. Bei Nominatim gelten die [Nutzungsregeln](https://operations.osmfoundation.org/policies/nominatim/): ein Prozess auf einer Maschine, maximal eine Anfrage pro Sekunde, identifizierender User-Agent `Fuelltreffer-Spielorte/1.0 (+https://darts.sc-oberfuellbach.de)`, Ergebnisse dauerhaft speichern. Keine periodische Aufgabe, kein Geocoding im Build oder Browser. Nur öffentlich bekannte Spielstätten abfragen.

Treffer nach Ort, Straße, Hausnummer oder benannter Sportstätte prüfen; ein Straßenmittelpunkt allein genügt nicht. Erst danach Koordinaten, `source` und den über `normalizeAddress()` gebildeten `addressKey` ergänzen. Die Positionsprüfung vom 05.09.2026 ergab:

| Spielort-ID | Grundlage der Zuordnung |
| --- | --- |
| 90 | Café Q, Vorderer Floßanger 31, benannter OSM-Punkt mit Adresse |
| 92 | Gebäudeadresse Unterer Markt 8, Sonneberg |
| 94 | Café Q, Neustadter Straße 113, benannter OSM-Punkt mit Adresse |
| 1957 | Sportheim Niederfüllbach, Schloßstraße 13, benannter OSM-Punkt |
| 1963 | Sportgelände Oberfüllbach, OSM-Fläche; Lage mit [anpfiff](https://www.anpfiff.info/sites/vereine/start.aspx?SK=1&Ver=568) und [Waze](https://www.waze.com/live-map/directions/sportplatz-sc-63-oberfullbach?to=place.w.7274998.72422305.467919) abgeglichen. Kein bestätigter Gebäudeeingang. |
| 1964 | Vereinsgebäude Galgenfuhr 30, Bamberg |
| 1965 | Sportheim Einberg, Am Sportplatz 19, benannter OSM-Punkt |
| 2311 | Gebäude Zur Sandgrube 4, Eisfeld |
| 2468 | Benannte OSM-Sportanlage FC Teutonia Haßlach; mit [anpfiff](https://www.anpfiff.info/sites/vereine/start.aspx?SK=1&Ver=531) abgeglichen. Marker zeigt die Anlage, nicht einen bestätigten Eingang der Teutonenlaube. |
| 3246 | Gemeindezentrum Eicha: [Kreissportbund](https://www.ksb-hildburghausen.de/aktuelle-meldungen/4441-info-veranstaltung-dart.html) bestätigt Dorfgemeinschaftshaus, Dorfstraße 7; [BDV](https://bdv-dart.liga.nu/cgi-bin/WebObjects/nuLigaDARTDE.woa/wa/courtInfo?federation=BDV&location=25627) bestätigt dieselbe Spieladresse. |

## Betrieb und Prüfung

Die OSM-Daten und gespeicherten Geocoding-Ergebnisse stammen von © OpenStreetMap-Mitwirkenden und stehen unter [ODbL](https://www.openstreetmap.org/copyright). Quellenangabe auf der Karte sichtbar lassen. [Kachelregeln](https://operations.osmfoundation.org/policies/tiles/) beachten: HTTPS, Browser-Caching und Referer beibehalten, keine Offline-Downloads oder Kachel-Vorababrufe. Für automatisierte Browsertests Kacheln ersetzen oder blockieren; keine OSM-Kacheln durch automatisches Zoomen laden.

`npm test` prüft Datenabdeckung, Whitelisting, Fehler-Fallbacks, Adressänderungen und gemeinsame Marker. Zusätzlich Desktop/Mobil, beide Themes, Auswahlaktionen, deaktiviertes JavaScript und blockierte Kacheln prüfen. Ein gezielter Offline-Build ist mit `TWOK_SOFTWARE_API_URL=http://127.0.0.1:9 npm run build` möglich; die statische Ausgabe liegt unter `dist/client/spielorte/index.html`.

Canonical- und Social-URLs verwenden `site` aus `astro.config.mjs`. Für die Karte werden keine neuen ENV-Variablen, API-Endpunkte oder Serverdienste benötigt.
