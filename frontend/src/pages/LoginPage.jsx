import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Headline from '../components/Headline.jsx';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Headline eyebrow="Account" title="Log in" subtitle="Access your AirTrace AI dashboard" />
      <div className="card panel" style={{ maxWidth: 420 }}>
        <form onSubmit={handleSubmit}>
          <div className="input" style={{ marginBottom: 12 }}>
            <label>Email</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          </div>
          <div className="input" style={{ marginBottom: 12 }}>
            <label>Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          </div>
          {error && <p style={{ color: 'var(--red)', fontSize: 12, marginBottom: 10 }}>{error}</p>}
          <button className="predict" type="submit" disabled={submitting}>
            {submitting ? 'Logging in…' : 'Log in'}
          </button>
        </form>
        <p className="sub" style={{ marginTop: 14 }}>
          No account? <Link to="/signup" style={{ color: 'var(--teal)' }}>Sign up</Link>
        </p>
        <p className="sub" style={{ marginTop: 10, fontSize: 11 }}>
          Demo admin: admin@airtrace.ai / Admin@123 · Demo user: user@airtrace.ai / User@123
        </p>
      </div>
    </>
  );
}
