require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./db');
const { seedZones, getAllZones, getZoneById, updateZoneFields } = require('./data/zones');
const authorities = require('./data/authorities');
const { seedUsers, findByEmail, findById, createUser, toPublic } = require('./data/users');
const { addMessage, listMessages } = require('./data/messages');
const { classifySource } = require('./classifier');
const { getChatbotReply } = require('./chatbot');
const { signToken, comparePassword } = require('./utils/auth');
const { authenticate, requireAdmin } = require('./middleware/auth');

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

/** Adds live date/time context + computed prediction to a zone record. */
function enrichZone(zoneDoc) {
  const zone = zoneDoc.toObject ? zoneDoc.toObject() : zoneDoc;
  const now = new Date();
  return {
    id: zone.id,
    name: zone.name,
    x: zone.x,
    y: zone.y,
    color: zone.color,
    station: zone.station,
    location: zone.location,
    pollutants: zone.pollutants,
    weather: zone.weather,
    context: {
      station: zone.station,
      location: zone.location,
      date: now.toISOString().slice(0, 10), // YYYY-MM-DD
      time: now.toTimeString().slice(0, 8), // HH:MM:SS
      month: now.toLocaleString('en-US', { month: 'long' }),
      year: now.getFullYear(),
    },
    prediction: classifySource(zone.pollutants),
  };
}

// ---------- Public: health & zones ----------

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'AirTrace AI backend' });
});

app.get('/api/zones', async (req, res) => {
  try {
    const zones = await getAllZones();
    res.json(zones.map(enrichZone));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load zones.' });
  }
});

app.get('/api/zones/:id', async (req, res) => {
  try {
    const zone = await getZoneById(req.params.id);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });
    res.json(enrichZone(zone));
  } catch (err) {
    res.status(500).json({ error: 'Failed to load zone.' });
  }
});

// ---------- Public: custom pollutant prediction ----------

app.post('/api/predict', (req, res) => {
  const { pm25, pm10, no2, co } = req.body;
  const values = { pm25: Number(pm25), pm10: Number(pm10), no2: Number(no2), co: Number(co) };
  const invalid = Object.entries(values).some(([, v]) => Number.isNaN(v) || v < 0);

  if (invalid) {
    return res.status(400).json({ error: 'pm25, pm10, no2, and co must be non-negative numbers.' });
  }

  res.json(classifySource(values));
});

// ---------- Public: chatbot ----------

app.post('/api/chatbot', (req, res) => {
  const { message } = req.body;
  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'message is required.' });
  }
  res.json({ reply: getChatbotReply(message) });
});

// ---------- Public: authorities directory ----------

app.get('/api/authorities', (req, res) => {
  res.json(authorities);
});

// ---------- Auth: register & login ----------

app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }
    if (await findByEmail(email)) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    // Signups are always role "user" — admin accounts are seeded, not self-registered.
    const user = await createUser({ name, email, password, role: 'user' });
    const token = signToken(user);
    res.status(201).json({ token, user: toPublic(user) });
  } catch (err) {
    res.status(500).json({ error: 'Registration failed.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await findByEmail(email || '');

    if (!user || !comparePassword(password || '', user.passwordHash)) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ token, user: toPublic(user) });
  } catch (err) {
    res.status(500).json({ error: 'Login failed.' });
  }
});

app.get('/api/auth/me', authenticate, async (req, res) => {
  try {
    const user = await findById(req.user.id);
    if (!user) return res.status(404).json({ error: 'User not found.' });
    res.json({ user: toPublic(user) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to load profile.' });
  }
});

// ---------- Admin only: edit zone data fields ----------

app.put('/api/admin/zones/:id', authenticate, requireAdmin, async (req, res) => {
  try {
    const { pm25, pm10, no2, so2, co, temperature, humidity, windSpeed, station, location } = req.body;

    const numericFields = { pm25, pm10, no2, so2, co, temperature, humidity, windSpeed };
    for (const [key, value] of Object.entries(numericFields)) {
      if (value !== undefined) {
        const num = Number(value);
        if (Number.isNaN(num) || num < 0) {
          return res.status(400).json({ error: `${key} must be a non-negative number.` });
        }
      }
    }

    const fields = {};
    if (pm25 !== undefined) fields.pm25 = Number(pm25);
    if (pm10 !== undefined) fields.pm10 = Number(pm10);
    if (no2 !== undefined) fields.no2 = Number(no2);
    if (so2 !== undefined) fields.so2 = Number(so2);
    if (co !== undefined) fields.co = Number(co);
    if (temperature !== undefined) fields.temperature = Number(temperature);
    if (humidity !== undefined) fields.humidity = Number(humidity);
    if (windSpeed !== undefined) fields.windSpeed = Number(windSpeed);
    if (station !== undefined) fields.station = String(station);
    if (location !== undefined) fields.location = String(location);

    const zone = await updateZoneFields(req.params.id, fields);
    if (!zone) return res.status(404).json({ error: 'Zone not found' });

    res.json(enrichZone(zone));
  } catch (err) {
    res.status(500).json({ error: 'Failed to update zone.' });
  }
});

// ---------- Admin only: message authorities ----------

app.post('/api/admin/messages', authenticate, requireAdmin, async (req, res) => {
  try {
    const { authority, subject, body } = req.body;
    if (!authority || !subject || !body) {
      return res.status(400).json({ error: 'authority, subject, and body are required.' });
    }

    const message = await addMessage({ authority, subject, body, sentBy: req.user.id });
    res.status(201).json(message);
  } catch (err) {
    res.status(500).json({ error: 'Failed to send message.' });
  }
});

app.get('/api/admin/messages', authenticate, requireAdmin, async (req, res) => {
  try {
    const messages = await listMessages();
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: 'Failed to load messages.' });
  }
});

// ---------- Startup: connect DB, seed data, then start listening ----------

(async () => {
  await connectDB();
  await seedUsers();
  await seedZones();

  app.listen(PORT, () => {
    console.log(`AirTrace AI backend running on http://localhost:${PORT}`);
  });
})();
