# Umami Analytics Integration

Diese App nutzt Umami Analytics für privacy-friendly Website-Tracking unter `https://analytics.ingomc.de` mit der Website-ID `d44a284e-297a-45a2-bfb7-eeec1171b60d`.

## Implementierte Tracking-Features

### Automatisches Tracking
- ✅ **Pageviews** - Automatisch durch Umami-Script
- ✅ **Tab-Wechsel** - Erkennt wenn User zwischen Browser-Tabs wechselt
- ✅ **Scroll-Verhalten** - Trackt Scroll-Tiefe (25%, 50%, 75%, 90%)
- ✅ **Lesezeit** - Zeit auf der Seite und Engagement
- ✅ **Externe Links** - Clicks auf externe Links
- ✅ **Hash-Navigation** - SPA-Navigation durch URL-Hash-Changes
- ✅ **Such-Queries** - Eingaben in Suchfeldern
- ✅ **Formulare** - Interaktionen mit Form-Feldern

### Dart-spezifische Events
- ✅ **Match-Views** - `trackDartEvents.matchView(matchId, eventId)`
- ✅ **Team-Views** - `trackDartEvents.teamView(teamId)`
- ✅ **Participant-Views** - `trackDartEvents.participantView(participantId)`
- ✅ **Liga-Tabelle** - `trackDartEvents.leagueTableView(eventId)`
- ✅ **Report-Submissions** - `trackDartEvents.reportSubmission(matchId, reportType)`

### UI-Interaktionen
- ✅ **Tab-Navigation** - Wechsel zwischen Tabs (Matches, Team, Tabelle)
- ✅ **Theme-Wechsel** - Änderungen zwischen Hell/Dunkel/System-Theme
- ✅ **Team-Auswahl** - Dropdown-Wechsel zwischen Teams
- ✅ **Button-Clicks** - Alle Buttons mit `data-track` Attribut

## Tracking-Utilities

### Basis-Funktionen
```javascript
import { trackEvent, trackDartEvents } from '/src/utils/umami.js';

// Einfache Events
trackEvent('custom_event', {
  key: 'value',
  page: window.location.pathname
});

// Dart-spezifische Events
trackDartEvents.matchView('123456', '15995');
trackDartEvents.teamView('308868');
```

### Automatische Initialisierung
Das Tracking wird automatisch in `Layout.astro` initialisiert:
```javascript
import { initializeTracking } from '/src/utils/umami.js';
initializeTracking();
```

## Getrackte Events

### Basis-Events
- `page_loaded` - Seite geladen mit Metadaten
- `page_exit` - Seite verlassen mit Engagement-Daten
- `tab_visible` / `tab_hidden` - Tab-Visibility-Changes
- `scroll_depth` - Scroll-Meilensteine erreicht
- `button_click` - Button-Interaktionen
- `form_interaction` - Formular-Nutzung
- `search_performed` - Such-Queries
- `external_link_click` - Externe Links geklickt

### Dart-App-spezifische Events
- `match_viewed` - Match-Seite aufgerufen
- `match_report_loaded` - Match-Report erfolgreich geladen
- `match_report_error` - Fehler beim Laden von Match-Reports
- `team_viewed` - Team-Seite aufgerufen
- `team_selected` - Team aus Dropdown ausgewählt
- `participant_viewed` - Participant-Seite aufgerufen
- `participant_data_loaded` - Participant-Daten erfolgreich geladen
- `participant_data_error` - Fehler beim Laden von Participant-Daten
- `league_table_viewed` - Liga-Tabelle aufgerufen
- `league_table_loaded` - Liga-Tabelle erfolgreich geladen
- `league_table_error` - Fehler beim Laden der Liga-Tabelle
- `tab_switch` - Navigation zwischen App-Tabs
- `theme_changed` - Theme gewechselt (Hell/Dunkel/System)

## Erweiterte Features

### Tab-Visibility Tracking
```javascript
// Automatisch implementiert - trackt:
- Wann User den Tab verlässt/zurückkommt
- Wie lange User auf dem Tab war
- Ob es ein langer (>5s) oder kurzer Return war
```

### Scroll-Depth Tracking
```javascript
// Automatisch implementiert - trackt:
- 25% der Seite gescrollt
- 50% der Seite gescrollt  
- 75% der Seite gescrollt
- 90% der Seite gescrollt
```

### Button-Tracking mit data-Attributen
Für automatisches Button-Tracking:
```html
<button data-track="button-type">Click me</button>
```

## Privacy & Performance
- ✅ **DSGVO-konform** - Umami ist privacy-friendly
- ✅ **Keine Cookies** - Tracking ohne personenbezogene Daten
- ✅ **Lightweight** - Minimaler Performance-Impact
- ✅ **Error-Handling** - Tracking-Fehler brechen App nicht
- ✅ **Client-Side** - Funktioniert mit Astro SSG

## Konfiguration

### Environment Variables
Die Umami-Konfiguration erfolgt über Environment-Variablen:

```bash
# .env
PUBLIC_UMAMI_URL=https://analytics.ingomc.de
PUBLIC_UMAMI_WEBSITE_ID=d44a284e-297a-45a2-bfb7-eeec1171b60d
```

**Wichtig**: Die Variablen müssen mit `PUBLIC_` beginnen, damit sie im Browser verfügbar sind.

### Umami-Script (automatisch konfiguriert)
```html
{umamiUrl && umamiWebsiteId && (
  <script 
    async 
    src={`${umamiUrl}/script.js`} 
    data-website-id={umamiWebsiteId}
    data-include-search="true"
    data-include-query="true"
  ></script>
)}
```

### Verschiedene Environments
Für verschiedene Environments können verschiedene Website-IDs genutzt werden:
```bash
# .env.production
PUBLIC_UMAMI_URL=https://analytics.ingomc.de
PUBLIC_UMAMI_WEBSITE_ID=d44a284e-297a-45a2-bfb7-eeec1171b60d

# .env.development  
PUBLIC_UMAMI_URL=https://analytics.ingomc.de
PUBLIC_UMAMI_WEBSITE_ID=development-website-id

# .env.local (für lokale Entwicklung - optional)
# PUBLIC_UMAMI_URL=
# PUBLIC_UMAMI_WEBSITE_ID=
```

## Debugging

Das Tracking-System ist fehlertolerant und loggt Debug-Infos in der Console:
```javascript
console.log('Tracking Event:', eventName, eventData);
```

Umami-Dashboard: https://analytics.ingomc.de