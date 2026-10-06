/**
 * Converts a raw array of PM2.5 readings into an SVG path.
 * Higher pollution values are plotted near the TOP of the chart
 * (matches the original design's "peak = worse" visual language).
 */
function buildPath(values, width = 600, height = 164, padding = 12) {
  if (!values || values.length === 0) {
    return { linePath: '', areaPath: '', peakX: 0, peakY: 0, min: 0, max: 0 };
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1 || 1);

  const coords = values.map((value, i) => {
    const normalized = (value - min) / range;
    const x = i * step;
    const y = padding + (1 - normalized) * (height - padding * 2);
    return [x, y];
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height}Z`;

  const peakIdx = values.indexOf(max);
  const [peakX, peakY] = coords[peakIdx];

  return { linePath, areaPath, peakX, peakY, min, max };
}

/** Builds N evenly spaced Y-axis ticks between min and max, with their pixel position. */
function buildYTicks(min, max, height = 164, padding = 12, count = 4) {
  const range = max - min || 1;
  const ticks = [];
  for (let i = 0; i < count; i += 1) {
    const value = Math.round(max - (range / (count - 1)) * i);
    const normalized = (value - min) / range;
    const y = padding + (1 - normalized) * (height - padding * 2);
    ticks.push({ value, y });
  }
  return ticks;
}

const HOUR_LABELS = ['00:00', '03:00', '06:00', '09:00', '12:00'];

export default function TrendChart({ zoneName = 'Selected zone', points = [], aqi, aqiStatus }) {
  const { linePath, areaPath, peakX, peakY, min, max } = buildPath(points);
  const hasData = points.length > 0;
  const yTicks = hasData ? buildYTicks(min, max) : [];

  return (
    <div className="card panel">
      <div className="cardhead">
        <div>
          <div className="cardtitle">Pollution pattern · last 12 hours</div>
          <div className="sub">{zoneName} · PM2.5 concentration (µg/m³)</div>
        </div>
        {hasData && (
          <span className="pill">
            AQI {aqi} · {aqiStatus}
          </span>
        )}
      </div>

      {hasData ? (
        <>
          <div style={{ display: 'flex', marginTop: 14 }}>
            {/* Y axis */}
            <div style={{ position: 'relative', width: 34, height: 164, flexShrink: 0 }}>
              {yTicks.map((tick) => (
                <span
                  key={tick.value}
                  style={{
                    position: 'absolute', right: 6, top: tick.y, transform: 'translateY(-50%)',
                    fontSize: 10, color: '#71999f', whiteSpace: 'nowrap',
                  }}
                >
                  {tick.value}
                </span>
              ))}
            </div>

            {/* Chart */}
            <div className="chart" style={{ flex: 1 }}>
              <svg viewBox="0 0 600 164" preserveAspectRatio="none">
                <defs>
                  <linearGradient id="area" x1="0" x2="0" y1="0" y2="1">
                    <stop stopColor="#45e0c0" stopOpacity="0.38" />
                    <stop offset="1" stopColor="#45e0c0" stopOpacity="0" />
                  </linearGradient>
                </defs>
                <path d={areaPath} fill="url(#area)" />
                <path d={linePath} fill="none" stroke="#45e0c0" strokeWidth="3" />
                <circle cx={peakX} cy={peakY} r="5" fill="#ffbd5b" stroke="#07181c" strokeWidth="3" />
              </svg>
            </div>
          </div>

          {/* X axis */}
          <div className="axis" style={{ marginLeft: 34 }}>
            {HOUR_LABELS.map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <p className="sub" style={{ textAlign: 'center', marginTop: 2, fontSize: 10 }}>Time (24h)</p>
        </>
      ) : (
        <p className="sub" style={{ padding: 16 }}>
          Select a zone or run an analysis to see the trend.
        </p>
      )}
    </div>
  );
}
