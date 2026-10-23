import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import './MapCard.css';

// Approximate centre of each monitored area (latitude, longitude), taken from public map
// sources. They mark the AREA, not an exact sensor position. A zone can also carry its own
// `lat` / `lng` (for example from the backend), which takes priority over this table.
const ZONE_COORDINATES = {
  z1: [11.018, 76.967], // Gandhipuram
  z2: [11.078, 77.002], // Saravanampatti
  z3: [11.003, 77.025], // Singanallur
  z4: [11.0105, 76.95], // RS Puram
};

const MAP_CENTER = [11.04, 76.985]; // Coimbatore
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const ATTRIBUTION =
  '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a> contributors';

// India CPCB AQI categories, in order, with the pin colour for each.
const AQI_LEGEND = [
  { label: 'Good', color: '#2ecc71' },
  { label: 'Satisfactory', color: '#a3e635' },
  { label: 'Moderate', color: '#facc15' },
  { label: 'Poor', color: '#fb923c' },
  { label: 'Very Poor', color: '#ef4444' },
  { label: 'Severe', color: '#b91c1c' },
];
const COLOR_BY_CATEGORY = Object.fromEntries(AQI_LEGEND.map((c) => [c.label, c.color]));

function coordinatesFor(zone) {
  if (Number.isFinite(zone.lat) && Number.isFinite(zone.lng)) return [zone.lat, zone.lng];
  return ZONE_COORDINATES[zone.id] || null;
}

/** Builds the pin with DOM nodes (textContent), so a zone name can never inject HTML. */
function buildPin(zone, isActive) {
  const aqi = zone.prediction?.aqi;
  const el = document.createElement('div');
  el.className = `airpin${isActive ? ' airpin-active' : ''}`;
  el.style.setProperty('--pin', COLOR_BY_CATEGORY[zone.prediction?.aqiStatus] || '#9bb8be');

  const dot = document.createElement('span');
  dot.className = 'airpin-dot';
  dot.textContent = aqi ?? '–';

  const name = document.createElement('span');
  name.className = 'airpin-name';
  name.textContent = zone.name;

  el.append(dot, name);
  return el;
}

/**
 * A pin's name is drawn to its right. If another pin is in the way (close on the right,
 * at about the same height), draw the name to the left instead. Runs after every redraw
 * and every zoom, because pin distances on screen change with the zoom level.
 */
const LABEL_REACH_PX = 150;
const LABEL_HEIGHT_PX = 30;

function layoutLabels(map, items) {
  const points = items.map((item) => map.latLngToContainerPoint(item.marker.getLatLng()));
  items.forEach((item, i) => {
    const blocked = points.some(
      (other, j) =>
        j !== i &&
        other.x - points[i].x > 0 &&
        other.x - points[i].x < LABEL_REACH_PX &&
        Math.abs(other.y - points[i].y) < LABEL_HEIGHT_PX
    );
    item.pin.classList.toggle('airpin-left', blocked);
  });
}

export default function MapCard({ zones = [], activeZoneId, onSelectZone }) {
  const hostRef = useRef(null);
  const mapRef = useRef(null);
  const markersRef = useRef(null);
  const fittedRef = useRef(false);
  const itemsRef = useRef([]); // [{ marker, pin }] for the pins currently drawn
  const onSelectRef = useRef(onSelectZone);
  onSelectRef.current = onSelectZone; // always the latest callback, without redrawing the map

  // Create the map once.
  useEffect(() => {
    const map = L.map(hostRef.current, {
      scrollWheelZoom: false, // so scrolling the page does not zoom the map by accident
      minZoom: 10,
      maxZoom: 17,
    }).setView(MAP_CENTER, 12);

    L.tileLayer(TILE_URL, { maxZoom: 19, attribution: ATTRIBUTION }).addTo(map);

    // Click the map to enable wheel zoom; leaving the map turns it off again.
    map.on('click', () => map.scrollWheelZoom.enable());
    map.on('mouseout', () => map.scrollWheelZoom.disable());
    map.on('zoomend', () => layoutLabels(map, itemsRef.current));

    markersRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    const resizeTimer = setTimeout(() => map.invalidateSize(), 0);

    return () => {
      clearTimeout(resizeTimer);
      map.remove();
      mapRef.current = null;
      markersRef.current = null;
      itemsRef.current = [];
      fittedRef.current = false;
    };
  }, []);

  // Redraw the pins whenever the data or the selected zone changes.
  useEffect(() => {
    const map = mapRef.current;
    const layer = markersRef.current;
    if (!map || !layer) return;

    layer.clearLayers();
    const points = [];
    const items = [];

    zones.forEach((zone) => {
      const position = coordinatesFor(zone);
      if (!position) return; // no known location for this zone: skip it, do not crash
      points.push(position);

      const isActive = zone.id === activeZoneId;
      const aqi = zone.prediction?.aqi;
      const pin = buildPin(zone, isActive);
      const marker = L.marker(position, {
        icon: L.divIcon({
          className: 'airpin-wrap',
          html: pin,
          iconSize: [40, 40],
          iconAnchor: [20, 20],
        }),
        title: aqi !== undefined ? `${zone.name} - AQI ${aqi}` : zone.name,
        alt: `Show source attribution for ${zone.name}`,
        keyboard: true,
        riseOnHover: true,
        zIndexOffset: isActive ? 1000 : 0,
      });
      marker.on('click', () => onSelectRef.current?.(zone));
      marker.addTo(layer);
      items.push({ marker, pin });
    });
    itemsRef.current = items;

    // Frame all zones once. Later data refreshes must not reset the user's zoom and position.
    if (points.length > 0 && !fittedRef.current) {
      map.fitBounds(L.latLngBounds(points), { padding: [40, 40], maxZoom: 14 });
      fittedRef.current = true;
    }
    layoutLabels(map, items);
  }, [zones, activeZoneId]);

  return (
    <div className="card mapcard">
      <div className="cardhead">
        <div>
          <div className="cardtitle">Coimbatore source map</div>
          <div className="sub">Pin colour = AQI category · number = AQI · click a pin for details</div>
        </div>
        <select className="select" defaultValue="today">
          <option value="today">Today · Hourly</option>
          <option value="week">Last 7 days</option>
        </select>
      </div>

      <div className="map-host">
        <div ref={hostRef} className="map-leaflet" />
        <div className="map-legend" aria-label="AQI colour legend">
          {AQI_LEGEND.map((c) => (
            <span key={c.label}>
              <i style={{ '--c': c.color }} />
              {c.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
