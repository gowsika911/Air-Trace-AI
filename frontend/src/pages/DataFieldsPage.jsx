import { useEffect, useState } from 'react';
import Headline from '../components/Headline.jsx';
import { fetchZones } from '../api.js';

// The 12 tracked data fields, grouped for display.
const FIELD_GROUPS = [
  {
    title: 'Air Quality',
    fields: [
      { key: 'pm25', label: 'PM2.5', unit: 'µg/m³', from: 'pollutants' },
      { key: 'pm10', label: 'PM10', unit: 'µg/m³', from: 'pollutants' },
      { key: 'no2', label: 'NO2', unit: 'µg/m³', from: 'pollutants' },
      { key: 'so2', label: 'SO2', unit: 'µg/m³', from: 'pollutants' },
      { key: 'co', label: 'CO', unit: 'mg/m³', from: 'pollutants' },
    ],
  },
  {
    title: 'Weather',
    fields: [
      { key: 'temperature', label: 'Temperature', unit: '°C', from: 'weather' },
      { key: 'humidity', label: 'Humidity', unit: '%', from: 'weather' },
      { key: 'windSpeed', label: 'Wind Speed', unit: 'km/h', from: 'weather' },
    ],
  },
  {
    title: 'Context',
    fields: [
      { key: 'station', label: 'Station', unit: '', from: 'root' },
      { key: 'location', label: 'Location', unit: '', from: 'root' },
      { key: 'date', label: 'Date', unit: '', from: 'context' },
      { key: 'time', label: 'Time', unit: '', from: 'context' },
    ],
  },
];

function readField(zone, field) {
  if (field.from === 'root') return zone[field.key];
  if (field.from === 'pollutants') return zone.pollutants?.[field.key];
  if (field.from === 'weather') return zone.weather?.[field.key];
  if (field.from === 'context') return zone.context?.[field.key];
  return '—';
}

export default function DataFieldsPage() {
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchZones().then(setZones).finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Headline
        eyebrow="Admin · Read-only"
        title="Data Fields"
        subtitle="Full monitoring data for every zone — 12 tracked fields across Air Quality, Weather, and Context"
      />

      {loading ? (
        <p className="sub">Loading…</p>
      ) : (
        FIELD_GROUPS.map((group) => (
          <div className="card panel" key={group.title} style={{ minHeight: 'auto', marginBottom: 16, overflowX: 'auto' }}>
            <div className="cardtitle">{group.title}</div>
            <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 12, fontSize: 12.5 }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--line)' }}>
                  <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)' }}>Zone</th>
                  {group.fields.map((f) => (
                    <th key={f.key} style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--muted)' }}>
                      {f.label} {f.unit && <span style={{ fontSize: 10 }}>({f.unit})</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {zones.map((zone) => (
                  <tr key={zone.id} style={{ borderBottom: '1px solid #1b3a40' }}>
                    <td style={{ padding: '7px 8px', fontWeight: 600 }}>{zone.name}</td>
                    {group.fields.map((f) => (
                      <td key={f.key} style={{ padding: '7px 8px', color: 'var(--ink)' }}>
                        {readField(zone, f)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))
      )}

      <p className="sub" style={{ marginTop: 8 }}>
        This page is read-only. To edit any value, use the Admin dashboard.
      </p>
    </>
  );
}
