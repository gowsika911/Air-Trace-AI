// Read-only pollutant display for non-admin users.
// Regular users can SEE levels but cannot edit them — only Admin can
// change data fields (via the Admin dashboard).
const FIELDS = [
  { key: 'pm25', label: 'PM2.5', unit: 'µg/m³' },
  { key: 'pm10', label: 'PM10', unit: 'µg/m³' },
  { key: 'no2', label: 'NO2', unit: 'µg/m³' },
  { key: 'so2', label: 'SO2', unit: 'µg/m³' },
  { key: 'co', label: 'CO', unit: 'mg/m³' },
];

export default function PollutantLevels({ zone }) {
  return (
    <div className="card panel">
      <div className="cardtitle">Pollutant levels</div>
      <div className="sub">
        {zone ? `${zone.name} · read-only` : 'Select a zone on the Dashboard to see levels'}
      </div>

      {zone ? (
        <div className="inputs" style={{ marginTop: 14 }}>
          {FIELDS.map(({ key, label, unit }) => (
            <div className="input" key={key}>
              <label>
                {label} <span className="unit">{unit}</span>
              </label>
              <div
                style={{
                  background: '#0a2227', border: '1px solid var(--line)', borderRadius: 8,
                  padding: '8px 9px', fontSize: 13, color: 'var(--ink)',
                }}
              >
                {zone.pollutants?.[key] ?? '—'}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="sub" style={{ marginTop: 14 }}>No zone selected yet.</p>
      )}

      <p className="sub" style={{ marginTop: 14, fontSize: 11 }}>
        Only Admin can change these values, from the Admin dashboard.
      </p>
    </div>
  );
}
