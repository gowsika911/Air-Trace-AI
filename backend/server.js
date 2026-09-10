const express = require('express');
const cors = require('cors');
const zones = require('./data/zones');
const { classifySource } = require('./classifier');

const app = express();
const PORT = process.env.PORT || 5000;

// Comma-separated list of allowed frontend origins, e.g.
// "https://airtrace-ai.vercel.app,http://localhost:5173"
// Falls back to allowing all origins if not set (fine for dev/demo).
const allowedOrigins = process.env.FRONTEND_URL
  ? process.env.FRONTEND_URL.split(',').map((s) => s.trim())
  : true;

app.use(cors({ origin: allowedOrigins }));
app.use(express.json());

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AirTrace AI backend' });
});

// Get all monitoring zones with their current dominant source
app.get('/api/zones', (req, res) => {
  const enriched = zones.map((zone) => ({
    ...zone,
    prediction: classifySource(zone.pollutants),
  }));
  res.json(enriched);
});

// Get a single zone by id
app.get('/api/zones/:id', (req, res) => {
  const zone = zones.find((z) => z.id === req.params.id);
  if (!zone) {
    return res.status(404).json({ error: 'Zone not found' });
  }
  res.json({ ...zone, prediction: classifySource(zone.pollutants) });
});

// Run source classification on a custom pollutant profile
app.post('/api/predict', (req, res) => {
  const { pm25, pm10, no2, co } = req.body;

  const values = { pm25: Number(pm25), pm10: Number(pm10), no2: Number(no2), co: Number(co) };
  const invalid = Object.entries(values).some(([, v]) => Number.isNaN(v) || v < 0);

  if (invalid) {
    return res.status(400).json({ error: 'pm25, pm10, no2, and co must be non-negative numbers.' });
  }

  const result = classifySource(values);
  res.json(result);
});

app.listen(PORT, () => {
  console.log(`AirTrace AI backend running on http://localhost:${PORT}`);
});
