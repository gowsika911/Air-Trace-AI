// Monitoring zones shown on the Coimbatore map.
// x, y are percentage positions inside the map card (matches original CSS z1-z4 classes).
const zones = [
  {
    id: 'z1',
    name: 'Gandhipuram',
    x: 42,
    y: 35,
    color: 'red',
    source: 'Traffic emissions',
    pollutants: { pm25: 128, pm10: 201, no2: 86, co: 2.1 },
  },
  {
    id: 'z2',
    name: 'Saravanampatti',
    x: 67,
    y: 25,
    color: 'amber',
    source: 'Industrial activity',
    pollutants: { pm25: 96, pm10: 150, no2: 40, co: 0.9 },
  },
  {
    id: 'z3',
    name: 'Singanallur',
    x: 60,
    y: 63,
    color: 'cyan',
    source: 'Construction dust',
    pollutants: { pm25: 70, pm10: 190, no2: 25, co: 0.6 },
  },
  {
    id: 'z4',
    name: 'RS Puram',
    x: 25,
    y: 61,
    color: 'teal',
    source: 'Seasonal background',
    pollutants: { pm25: 55, pm10: 80, no2: 18, co: 0.4 },
  },
];

module.exports = zones;
