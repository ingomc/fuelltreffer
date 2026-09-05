# Open-Graph-Vorschauen

Texte und Bildmetadaten stehen in `src/config/seo.ts`; das gemeinsame Layout rendert sie direkt ins HTML. Startseite und Spielorte haben jeweils ein eigenes Motiv. Liga und Teamanzahl in den Texten kommen aus `CURRENT_LEAGUE`.

## Bilddateien

| Seite | Öffentliche Datei | Format |
| --- | --- | --- |
| Startseite | `public/og/fuelltreffer-home-v2.jpg` | JPEG, 1200 × 630, ca. 137 KiB |
| Spielorte | `public/og/fuelltreffer-spielorte-v1.jpg` | JPEG, 1200 × 630, ca. 109 KiB |

Die generierten PNG-Originale liegen unter `src/assets/social/` mit denselben Basisnamen. Erstellung: eingebautes `image_gen`, 05.09.2026. Anschließend reiner Web-Export mit Sharp: 1200 × 630, JPEG-Qualität 88, mozjpeg. Die unten dokumentierten Prompts enthalten die Bildtexte.

## Metadaten und Veröffentlichung

- Absolute HTTPS-URLs auf Basis von `site` in `astro.config.mjs`.
- Bildtyp, tatsächliche Abmessungen und individuelle Alt-Texte gemäß [Open Graph](https://ogp.me/).
- `summary_large_image` mit denselben Bildern und Texten für X/Twitter.
- Canonical-URLs ohne Team-/Trackingparameter; Startseite und Spielorte bleiben separate Objekte.
- JPEGs direkt unter `public/`, ohne Laufzeitgenerierung oder externe Schriftarten.
- Bei einem Bildwechsel neuen Dateinamen verwenden und Metadaten gemeinsam aktualisieren. Bereits geteilte Links können bei Plattformen zwischengespeichert bleiben; nach dem Deployment bei Bedarf den [Meta Sharing Debugger](https://developers.facebook.com/tools/debug/) erneut abrufen lassen.
- Die früheren `og-image.png`/`og-image-optimized.svg` werden nicht mehr in den Metadaten verwendet.

## Original-Prompts

### Startseite

Use case: ads-marketing. Asset type: production Open Graph social preview image for a German amateur darts club web dashboard. Create ONE finished premium editorial sports graphic, landscape 1200 by 630 pixels, approximately 1.91:1 aspect ratio. It must be a designed social card, not a webpage mockup or framed screenshot. Edge-to-edge deep ink navy #0b1428 background, electric cobalt #2563eb and icy blue accents, crisp off-white typography. Sophisticated, confident, understated athletic design. Big bold condensed modern sans-serif text aligned on left with generous negative space. On right, an impressive highly detailed sculptural metallic steel-tip dart with vivid cobalt flights aimed at a close-up abstract concentric bullseye, dramatic controlled studio lighting, polished silver and satin blue materials. Avoid numbered dartboard so there are no wrong numbers. Subtle concentric rings subtly connect the typography and dart. All type must be impeccably readable in small link thumbnails. Keep critical text and main motif at least 70 pixels from every edge. Only text, exact German spelling, clear umlauts:
Small brand/eyebrow at upper left: "SCO-DARTS"
Huge title split on two lines at left: "Fülltreffer" / "Darts."
Supporting line: "Spielplan. Ergebnisse. Tabelle."
Small readable bottom-left domain: "darts.sc-oberfuellbach.de"
No other text, no sponsors, no invented scores or numbers, no photographs of people, no generic dashboard UI, no watermark, no gradients behind white text that harm contrast. Use stylish considered composition and typography, professional sports editorial identity. Generate final image itself.

### Spielorte

Use case: ads-marketing. Asset type: production Open Graph social preview image for the Spielorte page of a German amateur darts club website. Create ONE finished premium editorial sports graphic, landscape 1200 by 630 pixels, approximately 1.91:1 aspect ratio. It must be a designed social card, not a webpage mockup or framed screenshot. Edge-to-edge deep ink navy #0b1428 background, electric cobalt #2563eb and icy blue accents, crisp off-white typography. Sophisticated, confident, understated athletic design matching a Fülltreffer Darts brand. Big bold condensed modern sans-serif text aligned on left with generous negative space. On right a beautifully art-directed sculptural folded map made of satin midnight-blue material, thin subtle pale-blue abstract street lines, three bold cobalt-blue location pins, one sculptural silver-and-cobalt dart subtly integrated. This is conceptual artwork, no real geography, place names, OSM map tiles or map screenshots. Controlled studio lighting with sophisticated tactile shadows and metallic edge highlights. All type must be impeccably readable in small link thumbnails. Keep critical text and main motif at least 70 pixels from every edge. Only text, exact German spelling, clear umlauts:
Small brand/eyebrow at upper left: "FÜLLTREFFER DARTS"
Huge title split on two lines at left: "Unsere" / "Spielorte."
Supporting copy on two short lines: "Dein Weg zum" / "nächsten Spiel."
Small readable bottom-left domain: "darts.sc-oberfuellbach.de"
No other text, no sponsors, no invented statistics or numbers, no photographs of people, no generic dashboard UI, no watermark, no gradients behind white text that harm contrast. Use stylish considered composition and typography, professional sports editorial identity. Generate final image itself.

