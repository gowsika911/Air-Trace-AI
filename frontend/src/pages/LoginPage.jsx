
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
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    try {
      await login(email, password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Unable to log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-glow auth-glow-one" />
      <div className="auth-glow auth-glow-two" />

      <div className="auth-wrapper">
        <Link to="/" className="auth-brand">
          <span className="brand-icon">
            <svg viewBox="0 0 24 24" fill="none">
              <path
                d="M3 13h4l3-8 4 14 3-6h4"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span>
            <strong>AirTrace</strong>
            <span className="brand-ai"> AI</span>
            <small>SMARTER AIR. HEALTHIER LIFE.</small>
          </span>
        </Link>

        <Headline
          eyebrow="YOUR PERSONAL AIR INTELLIGENCE"
          title="Welcome back."
          subtitle="Sign in to explore your air quality dashboard."
        />

        <div className="auth-card">
          <div className="auth-card-top">
            <div>
              <h2>Sign in</h2>
              <p>Enter your credentials to continue.</p>
            </div>
            <div className="auth-shield">✦</div>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="auth-field">
              <label htmlFor="login-email">Email address</label>
              <div className="auth-input-wrap">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect
                    x="3" y="5" width="18" height="14" rx="3"
                    stroke="currentColor" strokeWidth="1.7"
                  />
                  <path
                    d="m4 7 8 6 8-6"
                    stroke="currentColor" strokeWidth="1.7"
                    strokeLinecap="round"
                  />
                </svg>
                <input
                  id="login-email"
                  type="email"
                  placeholder="you@example.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="login-password">Password</label>
              <div className="auth-input-wrap">
                <svg viewBox="0 0 24 24" fill="none">
                  <rect
                    x="4" y="10" width="16" height="11" rx="2"
                    stroke="currentColor" strokeWidth="1.7"
                  />
                  <path
                    d="M8 10V7a4 4 0 0 1 8 0v3"
                    stroke="currentColor" strokeWidth="1.7"
                  />
                </svg>
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Enter your password"
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <span>!</span>
                {error}
              </div>
            )}

            <button
              className="auth-submit"
              type="submit"
              disabled={submitting}
            >
              {submitting ? 'Signing in...' : 'Sign in to dashboard'}
              {!submitting && <span>→</span>}
            </button>
          </form>

          <div className="auth-divider">
            <span />
            <small>YOUR AIR QUALITY JOURNEY</small>
            <span />
          </div>

          <p className="auth-switch">
            New to AirTrace AI?
            <Link to="/signup">Create an account <span>↗</span></Link>
          </p>
        </div>

        <div className="auth-footer">
          <span className="status-dot" />
          Built for cleaner air and smarter decisions
        </div>
      </div>
    </div>
  );
}
