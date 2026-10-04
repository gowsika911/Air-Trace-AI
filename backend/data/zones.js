// Monitoring zones shown on the Coimbatore map.
// x, y are percentage positions inside the map card (matches original CSS z1-z4 classes).
//
// Data fields:
//  - Air quality: pm25, pm10, no2, so2, co
//  - Weather: temperature, humidity, windSpeed
//  - Context: station, location (date/time are generated live, not stored)
//
// NOTE: pm25/pm10/no2/co feed the source classifier (classifier.js).
// so2 and weather fields are monitoring/display data only for now.
const zones = [
  {
    id: 'z1',
    name: 'Gandhipuram',
    x: 42,
    y: 35,
    color: 'red',
    station: 'CB-STN-01',
    location: 'Gandhipuram, Coimbatore',
    pollutants: { pm25: 128, pm10: 201, no2: 86, so2: 18, co: 2.1 },
    weather: { temperature: 31.5, humidity: 58, windSpeed: 6.2 },
  },
  {
    id: 'z2',
    name: 'Saravanampatti',
    x: 67,
    y: 25,
    color: 'amber',
    station: 'CB-STN-02',
    location: 'Saravanampatti, Coimbatore',
    pollutants: { pm25: 96, pm10: 150, no2: 40, so2: 24, co: 0.9 },
    weather: { temperature: 30.1, humidity: 54, windSpeed: 8.4 },
  },
  {
    id: 'z3',
    name: 'Singanallur',
    x: 60,
    y: 63,
    color: 'cyan',
    station: 'CB-STN-03',
    location: 'Singanallur, Coimbatore',
    pollutants: { pm25: 70, pm10: 190, no2: 25, so2: 9, co: 0.6 },
    weather: { temperature: 32.0, humidity: 49, windSpeed: 5.5 },
  },
  {
    id: 'z4',
    name: 'RS Puram',
    x: 25,
    y: 61,
    color: 'teal',
    station: 'CB-STN-04',
    location: 'RS Puram, Coimbatore',
    pollutants: { pm25: 55, pm10: 80, no2: 18, so2: 6, co: 0.4 },
    weather: { temperature: 29.8, humidity: 61, windSpeed: 7.1 },
  },
];

module.exports = zones;
