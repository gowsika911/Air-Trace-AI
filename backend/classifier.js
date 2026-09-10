/**
 * classifySource(pollutants)
 *
 * Rule-based pollution source classifier.
 * This mirrors the logic pattern of the Random Forest model described in the
 * AirTrace AI base paper (hydrogen chloride / acetaldehyde as top features
 * for industry classification). Since a browser-facing demo only collects
 * PM2.5, PM10, NO2, and CO, this file uses documented pollutant signatures
 * as a stand-in rule engine.
 *
 * TO UPGRADE TO REAL ML:
 * Replace the body of this function with a call to a trained model
 * (e.g. load a Random Forest / ONNX model here, or call a Python
 * microservice that runs the trained model and returns JSON).
 * The input/output shape below should stay the same so the frontend
 * does not need to change.
 */

const SOURCE_PROFILES = {
  'Traffic emissions': {
    detail: 'Rush-hour NO2 and CO pattern detected at this location.',
    action: 'Deploy traffic police at peak junctions and activate signal-timing plan for the next 2 hours.',
  },
  'Industrial activity': {
    detail: 'Elevated PM2.5 with steady baseline suggests nearby industrial emissions.',
    action: 'Inspect nearby industrial stacks and verify emission-control equipment.',
  },
  'Construction dust': {
    detail: 'High PM10-to-PM2.5 ratio points to active dust generation.',
    action: 'Issue dust-suppression notice and inspect active construction sites.',
  },
  'Seasonal background': {
    detail: 'Diffuse particulate pattern with no dominant local source.',
    action: 'Maintain monitoring and publish a local health advisory.',
  },
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

// Indian CPCB National AQI breakpoints for PM2.5 (24-hr, µg/m³).
const AQI_BREAKPOINTS_PM25 = [
  { cLow: 0, cHigh: 30, aLow: 0, aHigh: 50, label: 'Good' },
  { cLow: 31, cHigh: 60, aLow: 51, aHigh: 100, label: 'Satisfactory' },
  { cLow: 61, cHigh: 90, aLow: 101, aHigh: 200, label: 'Moderate' },
  { cLow: 91, cHigh: 120, aLow: 201, aHigh: 300, label: 'Poor' },
  { cLow: 121, cHigh: 250, aLow: 301, aHigh: 400, label: 'Very Poor' },
  { cLow: 251, cHigh: 380, aLow: 401, aHigh: 500, label: 'Severe' },
];

/**
 * Convert a PM2.5 reading into an AQI value + category using the
 * Indian CPCB breakpoint table (linear interpolation within the band).
 */
function estimateAqi(pm25) {
  const value = clamp(pm25, 0, 500);
  const band = AQI_BREAKPOINTS_PM25.find((b) => value >= b.cLow && value <= b.cHigh)
    || AQI_BREAKPOINTS_PM25[AQI_BREAKPOINTS_PM25.length - 1];

  const aqi = Math.round(
    ((band.aHigh - band.aLow) / (band.cHigh - band.cLow)) * (value - band.cLow) + band.aLow
  );

  return { aqi: clamp(aqi, 0, 500), status: band.label };
}

/**
 * Build a deterministic 12-hour PM2.5 trend around a baseline reading.
 * Deterministic (not Math.random) so the same zone always shows the same
 * curve on refresh, but different zones/baselines produce visibly
 * different shapes and amplitudes.
 */
function buildTrend(baseline) {
  const points = [];
  for (let hour = 0; hour < 12; hour += 1) {
    const wave = Math.sin((hour + baseline) / 2) * (baseline * 0.18);
    const cycle = hour % 4 === 0 ? baseline * 0.12 : -baseline * 0.05;
    points.push(Math.max(5, Math.round(baseline + wave + cycle)));
  }
  return points;
}

function classifySource({ pm25, pm10, no2, co }) {
  const ratio = pm25 > 0 ? pm10 / pm25 : 0;

  const scores = {
    'Traffic emissions': no2 * 0.6 + co * 25,
    'Construction dust': clamp(ratio - 1, 0, 3) * 60,
    'Industrial activity': pm25 * 0.35 + (no2 < 30 ? 20 : 0),
    'Seasonal background': 100 - clamp(pm25, 0, 100),
  };

  const entries = Object.entries(scores);
  const total = entries.reduce((sum, [, value]) => sum + Math.max(value, 0), 0) || 1;

  entries.sort((a, b) => b[1] - a[1]);
  const [topSource, topScore] = entries[0];

  const confidence = Math.round(clamp((topScore / total) * 100, 30, 97));

  const breakdown = entries.map(([name, value]) => ({
    name,
    percentage: Math.round(clamp((Math.max(value, 0) / total) * 100, 0, 100)),
  }));

  const profile = SOURCE_PROFILES[topSource];
  const { aqi, status } = estimateAqi(pm25);

  return {
    source: topSource,
    confidence,
    detail: profile.detail,
    action: profile.action,
    breakdown,
    aqi,
    aqiStatus: status,
    trend: buildTrend(pm25),
  };
}

module.exports = { classifySource };
