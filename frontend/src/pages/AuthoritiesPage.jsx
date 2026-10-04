import { useEffect, useState } from 'react';
import Headline from '../components/Headline.jsx';
import { fetchAuthorities } from '../api.js';

export default function AuthoritiesPage() {
  const [authorities, setAuthorities] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAuthorities()
      .then(setAuthorities)
      .finally(() => setLoading(false));
  }, []);

  return (
    <>
      <Headline eyebrow="Reach out" title="Contact authorities" subtitle="Report pollution issues to the right department" />
      {loading ? (
        <p className="sub">Loading…</p>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {authorities.map((a) => (
            <div className="card panel" key={a.id} style={{ minHeight: 'auto' }}>
              <div className="cardtitle">{a.name}</div>
              <p className="sub" style={{ marginBottom: 10 }}>{a.category}</p>
              <p style={{ fontSize: 13, margin: '4px 0' }}>📞 {a.phone}</p>
              <p style={{ fontSize: 13, margin: '4px 0' }}>✉️ {a.email}</p>
            </div>
          ))}
        </div>
      )}
      <p className="sub" style={{ marginTop: 16 }}>
        Official bulk notifications to authorities are sent by AirTrace AI administrators via the Admin dashboard.
      </p>
    </>
  );
}
