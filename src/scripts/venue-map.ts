import 'leaflet/dist/leaflet.css';
import type { groupVenues } from '../lib/venue-data';

type VenueGroup = ReturnType<typeof groupVenues>[number];

async function initializeMap() {
  const container = document.getElementById('venue-map');
  const payload = document.getElementById('venue-map-data');
  const status = document.getElementById('venue-map-status');
  const reset = document.getElementById('show-all-venues');
  if (!container || !payload || !status) return;
  try {
    const groups: VenueGroup[] = JSON.parse(payload.textContent || '[]');
    if (!groups.length) {
      status.textContent = 'Noch keine markierten Spielorte verfügbar. Nutze die Adressen und OpenStreetMap-Links in der Liste.';
      return;
    }
    const L = await import('leaflet');
    container.replaceChildren();
    const map = L.map(container, { scrollWheelZoom: false });
    const markers = new Map<string, ReturnType<typeof L.marker>>();
    const bounds = L.latLngBounds(groups.map(group => [group.location.lat, group.location.lon]));
    let tileFailed = false;
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap contributors</a>',
    }).on('tileerror', () => {
      tileFailed = true;
      status.textContent = 'Die Hintergrundkarte konnte nicht vollständig geladen werden. Alle Adressen und OpenStreetMap-Links findest du weiterhin in der Liste.';
    }).on('load', () => {
      if (!tileFailed) status.textContent = 'Alle Spielorte im Überblick. Wähle einen Marker für die Adresse.';
    }).addTo(map);

    function selectTeams(ids: string[]) {
      document.querySelectorAll('.venue-card[data-selected]').forEach(card => card.removeAttribute('data-selected'));
      for (const id of ids) document.getElementById(`team-${id}`)?.setAttribute('data-selected', '');
    }

    for (const group of groups) {
      const content = document.createElement('div');
      const title = document.createElement('strong');
      title.textContent = group.teams.map(team => team.name).join(' · ');
      const address = document.createElement('p');
      address.style.whiteSpace = 'pre-line';
      address.textContent = `${group.venue.name}\n${group.venue.street}\n${group.venue.postalCode} ${group.venue.city}`;
      const link = document.createElement('a');
      link.href = group.osmUrl;
      link.textContent = 'In OpenStreetMap öffnen ↗';
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      content.append(title, address, link);
      const marker = L.marker([group.location.lat, group.location.lon], {
        title: group.teams.map(team => team.name).join(', '),
        alt: group.venue.name,
        icon: L.divIcon({
          className: 'venue-pin',
          html: '<span style="display:block;width:24px;height:24px;border:3px solid white;border-radius:50% 50% 50% 0;background:#2563eb;box-shadow:0 2px 6px #0006;transform:rotate(-45deg)"></span>',
          iconSize: [24, 24], iconAnchor: [12, 27], popupAnchor: [0, -27],
        }),
      }).bindPopup(content).addTo(map);
      marker.on('popupopen', () => selectTeams(group.teams.map(team => team.id)));
      for (const team of group.teams) markers.set(team.id, marker);
    }
    const showAll = () => { map.fitBounds(bounds, { padding: [30, 30], maxZoom: 13 }); };
    showAll();
    reset?.removeAttribute('hidden');
    reset?.addEventListener('click', () => {
      map.closePopup();
      selectTeams([]);
      showAll();
    });
    document.querySelectorAll<HTMLButtonElement>('[data-show-venue]').forEach(button => {
      const marker = markers.get(button.dataset.showVenue || '');
      if (!marker) return;
      button.hidden = false;
      button.addEventListener('click', () => {
        map.setView(marker.getLatLng(), 16);
        marker.openPopup();
        container.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
        container.focus({ preventScroll: true });
      });
    });
  } catch (_error) {
    status.textContent = 'Die interaktive Karte ist gerade nicht verfügbar. Nutze die Adressen und OpenStreetMap-Links in der Liste.';
  }
}

initializeMap();
