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

const FIELD_GROUPS = [
  { title: 'Air quality', fields: ['pm25', 'pm10', 'no2', 'so2', 'co'] },
  { title: 'Weather', fields: ['temperature', 'humidity', 'windSpeed'] },
];

function zoneToForm(zone) {
  return {
    pm25: zone.pollutants.pm25,
    pm10: zone.pollutants.pm10,
    no2: zone.pollutants.no2,
    so2: zone.pollutants.so2,
    co: zone.pollutants.co,
    temperature: zone.weather.temperature,
    humidity: zone.weather.humidity,
    windSpeed: zone.weather.windSpeed,
    station: zone.station,
    location: zone.location,
  };
}

/**
 * Single reusable 12-field form. Admin picks a city from the dropdown,
 * the form fills with that city's current values, edits, clicks Save,
 * then picks the next city and repeats — one form, not one per zone.
 */
function ZoneDataEditor({ zones, token, onSaved }) {
  const [selectedId, setSelectedId] = useState(zones[0]?.id || '');
  const [form, setForm] = useState(zones[0] ? zoneToForm(zones[0]) : {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const selectedZone = zones.find((z) => z.id === selectedId);

  const handleCityChange = (id) => {
    setSelectedId(id);
    const zone = zones.find((z) => z.id === id);
    if (zone) setForm(zoneToForm(zone));
    setSaved(false);
  };

  const update = (key, value) => setForm((f) => ({ ...f, [key]: value }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const updated = await updateZoneAdmin(token, selectedId, form);
      onSaved(updated);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="card panel" style={{ minHeight: 'auto' }}>
      <div className="cardhead">
        <div className="cardtitle">Edit zone data</div>
        <select
          className="select"
          value={selectedId}
          onChange={(e) => handleCityChange(e.target.value)}
        >
          {zones.map((z) => (
            <option key={z.id} value={z.id}>{z.name}</option>
          ))}
        </select>
      </div>

      {selectedZone && (
        <>
          <div className="inputs" style={{ marginTop: 14 }}>
            <div className="input">
              <label>Station</label>
              <input value={form.station} onChange={(e) => update('station', e.target.value)} />
            </div>
            <div className="input">
              <label>Location</label>
              <input value={form.location} onChange={(e) => update('location', e.target.value)} />
            </div>
          </div>

          {FIELD_GROUPS.map((group) => (
            <div key={group.title}>
              <p className="sub" style={{ marginTop: 14, marginBottom: 4 }}>{group.title}</p>
              <div className="inputs">
                {group.fields.map((f) => (
                  <div className="input" key={f}>
                    <label>{f}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={form[f]}
                      onChange={(e) => update(f, e.target.value)}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}

          <button className="predict" style={{ marginTop: 14 }} onClick={handleSave} disabled={saving}>
            {saving ? 'Saving…' : saved ? `Saved — ${selectedZone.name} ✓` : `Save changes for ${selectedZone.name}`}
          </button>
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
