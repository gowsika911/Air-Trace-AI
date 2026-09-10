export default function CausePanel({ aqi, aqiStatus, source, detail }) {
  const hasData = aqi !== undefined && aqi !== null;

  return (
    <div className="card panel">
      <div className="cardtitle">Why this prediction?</div>

      <div className="metric">
        <div>
          <div className="sub">Current AQI</div>
          <b>{hasData ? aqi : '—'}</b>
        </div>
        <span className="pill">{hasData ? `${aqiStatus} air quality` : 'No data yet'}</span>
      </div>

      <div className="cause">
        <div className="tag">Strong signal</div>
        <p>{detail || 'Select a zone or run an analysis to see the reasoning behind a prediction.'}</p>
      </div>

      <div className="cause">
        <div className="tag" style={{ color: 'var(--cyan)' }}>
          Dominant source
        </div>
        <p>{source || 'Not determined yet.'}</p>
      </div>
    </div>
  );
}
