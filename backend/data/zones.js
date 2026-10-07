const Zone = require('../models/Zone');

// Seed data — used only to populate the database on first run.
// Data fields: Air quality (pm25, pm10, no2, so2, co), Weather (temperature,
// humidity, windSpeed), Context (station, location — date/time are live).
const SEED_ZONES = [
  {
    id: 'z1', name: 'Gandhipuram', x: 42, y: 35, color: 'red',
    station: 'CB-STN-01', location: 'Gandhipuram, Coimbatore',
    pollutants: { pm25: 128, pm10: 201, no2: 86, so2: 18, co: 2.1 },
    weather: { temperature: 31.5, humidity: 58, windSpeed: 6.2 },
  },
  {
    id: 'z2', name: 'Saravanampatti', x: 67, y: 25, color: 'amber',
    station: 'CB-STN-02', location: 'Saravanampatti, Coimbatore',
    pollutants: { pm25: 96, pm10: 150, no2: 40, so2: 24, co: 0.9 },
    weather: { temperature: 30.1, humidity: 54, windSpeed: 8.4 },
  },
  {
    id: 'z3', name: 'Singanallur', x: 60, y: 63, color: 'cyan',
    station: 'CB-STN-03', location: 'Singanallur, Coimbatore',
    pollutants: { pm25: 70, pm10: 190, no2: 25, so2: 9, co: 0.6 },
    weather: { temperature: 32.0, humidity: 49, windSpeed: 5.5 },
  },
  {
    id: 'z4', name: 'RS Puram', x: 25, y: 61, color: 'teal',
    station: 'CB-STN-04', location: 'RS Puram, Coimbatore',
    pollutants: { pm25: 55, pm10: 80, no2: 18, so2: 6, co: 0.4 },
    weather: { temperature: 29.8, humidity: 61, windSpeed: 7.1 },
  },
];

/**
 * Seeds default zones if the zones collection is empty.
 * Runs once, on server startup (see server.js).
 */
async function seedZones() {
  const count = await Zone.countDocuments();
  if (count > 0) return;
  await Zone.insertMany(SEED_ZONES);
  console.log('Seeded default zones.');
}

function getAllZones() {
  return Zone.find().sort({ id: 1 });
}

function getZoneById(id) {
  return Zone.findOne({ id });
}

async function updateZoneFields(id, fields) {
  const zone = await Zone.findOne({ id });
  if (!zone) return null;

  const { pm25, pm10, no2, so2, co, temperature, humidity, windSpeed, station, location } = fields;

  if (pm25 !== undefined) zone.pollutants.pm25 = pm25;
  if (pm10 !== undefined) zone.pollutants.pm10 = pm10;
  if (no2 !== undefined) zone.pollutants.no2 = no2;
  if (so2 !== undefined) zone.pollutants.so2 = so2;
  if (co !== undefined) zone.pollutants.co = co;
  if (temperature !== undefined) zone.weather.temperature = temperature;
  if (humidity !== undefined) zone.weather.humidity = humidity;
  if (windSpeed !== undefined) zone.weather.windSpeed = windSpeed;
  if (station !== undefined) zone.station = station;
  if (location !== undefined) zone.location = location;

  await zone.save();
  return zone;
}

module.exports = { seedZones, getAllZones, getZoneById, updateZoneFields };
