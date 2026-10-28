import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout, { Field, PasswordField, MailIcon } from '../components/AuthLayout.jsx';
import './AuthPage.css';

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Already signed in: go straight to the dashboard.
  if (isAuthenticated) return <Navigate to="/" replace />;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not log in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Log in to your AirTrace AI account."
      footer={<>New here? <Link to="/signup">Create an account</Link></>}
    >
      <form onSubmit={handleSubmit}>
        {error && <div className="auth-error" role="alert">{error}</div>}

        <Field
          label="Email"
          name="email"
          type="email"
          icon={<MailIcon />}
          value={email}
          onChange={setEmail}
          autoComplete="email"
          placeholder="you@example.com"
          disabled={submitting}
        />
        <PasswordField
          label="Password"
          name="password"
          value={password}
          onChange={setPassword}
          autoComplete="current-password"
          placeholder="Your password"
          disabled={submitting}
        />

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? (<><span className="auth-spinner" aria-hidden="true" />Logging in…</>) : 'Log in'}
        </button>
      </form>

      {/* Demo accounts are hidden by default. For a local demo, create frontend/.env.local
          containing VITE_SHOW_DEMO_LOGINS=true. In a normal build this block is removed. */}
      {import.meta.env.VITE_SHOW_DEMO_LOGINS === 'true' && (
        <p className="auth-demo">
          Demo admin: admin@airtrace.ai / Admin@123 · Demo user: user@airtrace.ai / User@123
        </p>
      )}
    </AuthLayout>
  );
}
