import { CURRENT_LEAGUE } from './league';

export interface SocialImage {
  path: string;
  width: number;
  height: number;
  type: 'image/jpeg' | 'image/png';
  alt: string;
}

export const SITE_NAME = 'Fülltreffer Darts';

// Static, versioned files allow social crawlers to fetch images without JavaScript.
export const HOME_SEO = {
  title: 'Fülltreffer Darts – Spielplan, Ergebnisse & Tabelle',
  description: `Spielplan, Ergebnisse und Tabelle der ${CURRENT_LEAGUE.name}. Verfolge das SCO-Darts Team Fülltreffer und entdecke alle Teams und Spielorte der Liga.`,
  image: {
    path: '/og/fuelltreffer-home-v2.jpg',
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: 'Fülltreffer Darts: Spielplan, Ergebnisse, Tabelle. Ein blauer Dart trifft eine stilisierte Dartscheibe auf dunkelblauem Hintergrund.',
  } satisfies SocialImage,
};

export const VENUES_SEO = {
  title: `Spielorte der ${CURRENT_LEAGUE.name} – Fülltreffer Darts`,
  description: `Alle ${CURRENT_LEAGUE.teams.length} Teams der ${CURRENT_LEAGUE.name} auf einer Karte: Spielstätten, Adressen und direkte OpenStreetMap-Links für deine nächste Auswärtsfahrt.`,
  image: {
    path: '/og/fuelltreffer-spielorte-v1.jpg',
    width: 1200,
    height: 630,
    type: 'image/jpeg',
    alt: 'Unsere Spielorte. Dein Weg zum nächsten Spiel. Eine stilisierte dunkelblaue Karte mit drei blauen Standortmarkern und einem Dart.',
  } satisfies SocialImage,
};
