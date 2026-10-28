
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Headline from '../components/Headline.jsx';

export default function SignupPage() {
  const { signup } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await signup(name, email, password);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <Headline
          eyebrow="Account"
          title="Create an account"
          subtitle="Sign up as a citizen user"
        />

        <div className="card panel login-card">
          <form onSubmit={handleSubmit}>
            <div className="input">
              <label>Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="input">
              <label>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="input">
              <label>Password (min 6 characters)</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
                required
              />
            </div>

            {error && (
              <p className="login-error">{error}</p>
            )}

            <button
              className="predict"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Creating account…' : 'Sign up'}
            </button>
          </form>

          <p className="sub signup-text">
            Already have an account?{' '}
            <Link to="/login" className="signup-link">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

