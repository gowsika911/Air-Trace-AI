const BAR_COLORS = {
  'Traffic emissions': undefined, // default teal->cyan gradient
  'Construction dust': 'var(--amber)',
  'Industrial activity': 'var(--cyan)',
  'Seasonal background': 'var(--teal)',
};

export default function ResultCard({ zoneLabel, prediction, loading }) {
  if (!prediction) {
    return (
      <div className="card result">
        <div className="cardtitle">AI source attribution</div>
        <p className="sub">Select a zone or run an analysis to see results.</p>
      </div>
    );
  }

  const { source, confidence, detail, action, breakdown } = prediction;

  return (
    <div className="card result">
      <div className="cardhead">
        <div>
          <div className="cardtitle">AI source attribution</div>
          <div className="sub">{zoneLabel}</div>
        </div>
        <span className="live">{loading ? 'Updating…' : 'Updated now'}</span>
      </div>

      <div className="source" style={{ opacity: loading ? 0.6 : 1 }}>
        <div className="score">{confidence}% CONFIDENCE · DOMINANT SOURCE</div>
        <h2>{source}</h2>
        <p>{detail}</p>
      </div>

      {breakdown.map((item) => (
        <div className="barrow" key={item.name}>
          <span>{item.name.split(' ')[0]}</span>
          <div className="bar">
            <div
              className="fill"
              style={{
                width: `${item.percentage}%`,
                background: BAR_COLORS[item.name],
              }}
            />
          </div>
          <b>{item.percentage}%</b>
        </div>
      ))}

      <div className="reco">
        <b>Recommended response</b>
        <div className="recommend">
          <div className="icon">↗</div>
          <span>{action}</span>
        </div>
      </div>
    </div>
  );
}
