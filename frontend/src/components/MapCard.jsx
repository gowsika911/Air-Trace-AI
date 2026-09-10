export default function MapCard({ zones, activeZoneId, onSelectZone }) {
  return (
    <div className="card mapcard">
      <div className="cardhead">
        <div>
          <div className="cardtitle">Coimbatore source map</div>
          <div className="sub">Dominant source by monitoring zone</div>
        </div>
        <select className="select" defaultValue="today">
          <option value="today">Today · Hourly</option>
          <option value="week">Last 7 days</option>
        </select>
      </div>
      <div className="map">
        <div className="river" />
        {zones.map((zone) => (
          <button
            key={zone.id}
            className={`zone zone-${zone.color}${zone.id === activeZoneId ? ' active' : ''}`}
            style={{ left: `${zone.x}%`, top: `${zone.y}%` }}
            data-name={zone.name}
            onClick={() => onSelectZone(zone)}
            aria-label={`Show source attribution for ${zone.name}`}
          />
        ))}
        <div className="legend">
          <b>●</b> Source intensity{' '}
          <span style={{ color: 'var(--red)' }}>High</span> ·{' '}
          <span style={{ color: 'var(--amber)' }}>Medium</span> ·{' '}
          <span style={{ color: 'var(--teal)' }}>Low</span>
        </div>
      </div>
    </div>
  );
}
