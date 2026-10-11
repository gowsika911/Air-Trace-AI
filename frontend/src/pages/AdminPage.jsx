import { useEffect, useState } from 'react';
import Headline from '../components/Headline.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import {
  fetchZones,
  updateZoneAdmin,
  fetchAuthorities,
  sendAuthorityMessage,
  fetchSentMessages,
} from '../api.js';

// The 12 data fields, in 3 groups. key = name used by the API.
const FIELD_GROUPS = [
  {
    title: 'Context',
    fields: [
      { key: 'station', label: 'Station', type: 'text' },
      { key: 'location', label: 'Location', type: 'text' },
      { key: 'date', label: 'Date', type: 'date' },
      { key: 'time', label: 'Time', type: 'time' },
    ],
  },
  {
    title: 'Air quality',
    fields: [
      { key: 'pm25', label: 'PM2.5 (µg/m³)', type: 'number' },
      { key: 'pm10', label: 'PM10 (µg/m³)', type: 'number' },
      { key: 'no2', label: 'NO2 (µg/m³)', type: 'number' },
      { key: 'so2', label: 'SO2 (µg/m³)', type: 'number' },
      { key: 'co', label: 'CO (mg/m³)', type: 'number' },
    ],
  },
  {
    title: 'Weather',
    fields: [
      { key: 'temperature', label: 'Temperature (°C)', type: 'number' },
      { key: 'humidity', label: 'Humidity (%)', type: 'number' },
      { key: 'windSpeed', label: 'Wind speed (km/h)', type: 'number' },
    ],
  },
];

const ALL_KEYS = FIELD_GROUPS.flatMap((g) => g.fields.map((f) => f.key)); // 12 keys

function pad(n) {
  return String(n).padStart(2, '0');
}

/** Current local date (YYYY-MM-DD) and time (HH:MM), for the "Set to now" button. */
function nowParts() {
  const d = new Date();
  return {
    date: `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`,
    time: `${pad(d.getHours())}:${pad(d.getMinutes())}`,
  };
}

function zoneToForm(zone) {
  return {
    station: zone.station,
    location: zone.location,
    date: zone.context?.date ?? nowParts().date,
    time: zone.context?.time ?? nowParts().time,
    pm25: zone.pollutants.pm25,
    pm10: zone.pollutants.pm10,
    no2: zone.pollutants.no2,
    so2: zone.pollutants.so2,
    co: zone.pollutants.co,
    temperature: zone.weather.temperature,
    humidity: zone.weather.humidity,
    windSpeed: zone.weather.windSpeed,
  };
}

/**
 * One reusable form with all 12 fields. Admin picks a city, edits, saves,
 * then picks the next city. After saving, the form shows what the server
 * stored and the result panel shows the recalculated AQI and source.
 */
function ZoneDataEditor({ zones, token, onSaved }) {
  const [selectedId, setSelectedId] = useState(zones[0]?.id || '');
  const [form, setForm] = useState(zones[0] ? zoneToForm(zones[0]) : {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(null);

  const selectedZone = zones.find((z) => z.id === selectedId);
  const prediction = selectedZone?.prediction;

  const handleCityChange = (id) => {
    setSelectedId(id);
    const zone = zones.find((z) => z.id === id);
    if (zone) setForm(zoneToForm(zone));
    setSaved(false);
    setError(null);
  };

  const update = (key, value) => {
    setForm((f) => ({ ...f, [key]: value }));
    setSaved(false);
  };

  const setToNow = () => {
    const { date, time } = nowParts();
    setForm((f) => ({ ...f, date, time }));
    setSaved(false);
  };

  const handleSave = async () => {
    setError(null);
    const missing = ALL_KEYS.filter((k) => String(form[k] ?? '').trim() === '');
    if (missing.length > 0) {
      setError('Please fill all 12 fields before saving.');
      return;
    }

    setSaving(true);
    try {
      const updated = await updateZoneAdmin(token, selectedId, form);
      onSaved(updated);
      setForm(zoneToForm(updated)); // show exactly what the server stored
      setSaved(true);
    } catch (err) {
      setError(err.message || 'Could not save. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card panel" style={{ minHeight: 'auto' }}>
      <div className="cardhead">
        <div>
          <div className="cardtitle">Edit zone data</div>
          <div className="sub">12 data fields per station</div>
        </div>
        <select className="select" value={selectedId} onChange={(e) => handleCityChange(e.target.value)}>
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
      </div>

      {selectedZone && (
        <>
          {FIELD_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="sub" style={{ marginTop: 14, marginBottom: 4 }}>
                {group.title}
                {group.title === 'Context' && (
                  <button
                    type="button"
                    onClick={setToNow}
                    style={{
                      marginLeft: 10, background: 'none', border: '1px solid var(--line)', color: 'var(--teal)',
                      borderRadius: 6, padding: '2px 8px', fontSize: 11, cursor: 'pointer', fontFamily: 'inherit',
                    }}
                  >
                    Set date &amp; time to now
                  </button>
                )}
              </p>
              <div className="inputs">
                {group.fields.map((f) => (
                  <div className="input" key={f.key}>
                    <label>{f.label}</label>
                    <input
                      data-field={f.key}
                      type={f.type}
                      step={f.type === 'number' ? '0.1' : undefined}
                      value={form[f.key] ?? ''}
                      onChange={(e) => update(f.key, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          {error && <p style={{ color: 'var(--red)', fontSize: 12, marginTop: 10 }}>{error}</p>}

          <button className="predict" style={{ marginTop: 14 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : saved ? `Saved — ${selectedZone.name} ✓` : `Save changes for ${selectedZone.name}`}
          </button>

          {prediction && (
            <div className="cause" style={{ marginTop: 14 }}>
              <div className="tag">Current result · {selectedZone.name}</div>
              <p>
                <b style={{ color: 'var(--ink)' }}>AQI {prediction.aqi}</b> ({prediction.aqiStatus}) ·{' '}
                {prediction.source} · {prediction.confidence}% confidence
              </p>
              <p style={{ marginTop: 4 }}>Suggested action: {prediction.action}</p>
              <p style={{ marginTop: 4, fontSize: 11 }}>
                Recorded {selectedZone.context?.date} {selectedZone.context?.time} · updates after every save
              </p>
            </div>
          )}

          <p className="sub" style={{ marginTop: 8, fontSize: 11 }}>
            Pick another city from the dropdown above to edit it next.
          </p>
        </>
      )}
    </div>
  );
}

function AuthorityMessenger({ token }) {
  const [authorities, setAuthorities] = useState([]);
  const [history, setHistory] = useState([]);
  const [form, setForm] = useState({ authority: '', subject: '', body: '' });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState(null);

  const loadHistory = () => fetchSentMessages(token).then(setHistory).catch(() => {});

  useEffect(() => {
    fetchAuthorities().then((list) => {
      setAuthorities(list);
      setForm((f) => ({ ...f, authority: list[0]?.id || '' }));
    });
    loadHistory();
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    setError(null);
    setSending(true);
    try {
      await sendAuthorityMessage(token, form);
      setForm((f) => ({ ...f, subject: '', body: '' }));
      loadHistory();
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="card panel" style={{ minHeight: 'auto' }}>
      <div className="cardtitle">Message an authority</div>
      <p className="sub">Only admins can send official notifications</p>

      <form onSubmit={handleSend} style={{ marginTop: 12 }}>
        <div className="input" style={{ marginBottom: 10 }}>
          <label>Authority</label>
          <select
            className="select"
            style={{ width: '100%' }}
            value={form.authority}
            onChange={(e) => setForm((f) => ({ ...f, authority: e.target.value }))}
          >
            {authorities.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div className="input" style={{ marginBottom: 10 }}>
          <label>Subject</label>
          <input
            value={form.subject}
            onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
            required
          />
        </div>
        <div className="input" style={{ marginBottom: 10 }}>
          <label>Message</label>
          <textarea
            value={form.body}
            onChange={(e) => setForm((f) => ({ ...f, body: e.target.value }))}
            required
            rows={4}
            style={{
              width: '100%', background: '#0a2227', border: '1px solid var(--line)',
              borderRadius: 8, padding: '8px 9px', color: 'var(--ink)', fontFamily: 'inherit', fontSize: 13,
            }}
          />
        </div>
        {error && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 8 }}>{error}</p>}
        <button className="predict" type="submit" disabled={sending}>
          {sending ? 'Sending…' : 'Send to authority'}
        </button>
      </form>

      {history.length > 0 && (
        <>
          <p className="sub" style={{ marginTop: 16, marginBottom: 6 }}>Sent history</p>
          <div style={{ maxHeight: 180, overflowY: 'auto' }}>
            {history.map((m) => (
              <div key={m.id} className="cause" style={{ marginTop: 8 }}>
                <div className="tag">{m.subject}</div>
                <p>{m.body}</p>
                <p style={{ fontSize: 10, color: '#6f9da4', marginTop: 4 }}>
                  To: {m.authority} · {new Date(m.sentAt).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default function AdminPage() {
  const { token, user } = useAuth();
  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchZones().then(setZones).finally(() => setLoading(false));
  }, []);

  const handleZoneSaved = (updated) => {
    setZones((prev) => prev.map((z) => (z.id === updated.id ? { ...z, ...updated } : z)));
  };

  return (
    <>
      <Headline eyebrow="Admin" title="Admin dashboard" subtitle={`Signed in as ${user?.name} — data fields are editable here only`} />

      {loading ? (
        <p className="sub">Loading zones…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ZoneDataEditor zones={zones} token={token} onSaved={handleZoneSaved} />
          <AuthorityMessenger token={token} />
        </div>
      )}
    </>
  );
}
