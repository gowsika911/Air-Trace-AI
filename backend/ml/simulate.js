/**
 * SIMULATED training data.
 *
 * There is no public dataset of air-quality readings labelled with their pollution
 * source, so we generate sample readings from typical pollutant "signatures":
 *   - Traffic:      high NO2 and CO
 *   - Industrial:   high SO2, moderate NO2
 *   - Construction: very high PM10 relative to PM2.5 (coarse dust)
 *   - Seasonal:     low, diffuse readings
 * Every class overlaps with the others (normal distributions), so the problem is not trivial.
 *
 * IMPORTANT: this is a demonstration of the ML pipeline. Accuracy measured on this data
 * says nothing about accuracy on real-world readings.
 */
const { CLASSES } = require('./features');

// [mean, standard deviation] for each reading. Units: ug/m3 (CO in mg/m3).
const PROFILES = {
  'Traffic emissions':   { pm25: [100, 30], ratio: [1.55, 0.2],  no2: [75, 22], so2: [14, 5], co: [1.8, 0.5] },
  'Industrial activity': { pm25: [95, 28],  ratio: [1.55, 0.2],  no2: [40, 14], so2: [26, 7], co: [0.9, 0.35] },
  'Construction dust':   { pm25: [70, 22],  ratio: [2.7, 0.45],  no2: [25, 10], so2: [9, 4],  co: [0.6, 0.25] },
  'Seasonal background': { pm25: [52, 16],  ratio: [1.45, 0.2],  no2: [18, 7],  so2: [6, 3],  co: [0.4, 0.15] },
};

/** Small seeded random generator, so results are reproducible. */
function makeRng(seed) {
  let a = seed >>> 0;
  const rand = () => {
    a += 0x6d2b79f5;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const normal = (mean, sd) => {
    const u = Math.max(rand(), 1e-12);
    const v = rand();
    return mean + sd * Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
  };
  return { rand, normal };
}

const round1 = (n) => Math.round(n * 10) / 10;

function sampleReading(profile, rng) {
  const pm25 = Math.max(5, rng.normal(...profile.pm25));
  const ratio = Math.max(1.05, rng.normal(...profile.ratio));
  return {
    pm25: round1(pm25),
    pm10: round1(pm25 * ratio),
    no2: round1(Math.max(2, rng.normal(...profile.no2))),
    so2: round1(Math.max(0.5, rng.normal(...profile.so2))),
    co: Math.round(Math.max(0.05, rng.normal(...profile.co)) * 100) / 100,
  };
}

const keyOf = (r) => `${r.pm25}|${r.pm10}|${r.no2}|${r.so2}|${r.co}`;

/**
 * Generates `perClass` readings for each class. `seen` is shared between calls, so a
 * reading that already exists (in the training set, say) is never created again in the
 * test set - no duplicate rows anywhere.
 */
function generateDataset(perClass, seed, seen = new Set()) {
  const rng = makeRng(seed);
  const rows = [];
  CLASSES.forEach((name, label) => {
    let made = 0;
    while (made < perClass) {
      const reading = sampleReading(PROFILES[name], rng);
      const key = keyOf(reading);
      if (seen.has(key)) continue; // duplicate row: skip it
      seen.add(key);
      rows.push({ reading, label });
      made += 1;
    }
  });
  return rows;
}

module.exports = { PROFILES, makeRng, generateDataset, keyOf };
