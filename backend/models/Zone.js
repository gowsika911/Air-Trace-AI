const mongoose = require('mongoose');

const zoneSchema = new mongoose.Schema({
  // Our own stable identifier (z1, z2, ...) — kept separate from Mongo's _id
  // so existing frontend code and URLs (/api/zones/z1) don't need to change.
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  color: { type: String, required: true },
  station: { type: String, required: true },
  location: { type: String, required: true },
  pollutants: {
    pm25: { type: Number, required: true },
    pm10: { type: Number, required: true },
    no2: { type: Number, required: true },
    so2: { type: Number, required: true },
    co: { type: Number, required: true },
  },
  weather: {
    temperature: { type: Number, required: true },
    humidity: { type: Number, required: true },
    windSpeed: { type: Number, required: true },
  },
}, { timestamps: true });

module.exports = mongoose.model('Zone', zoneSchema);
