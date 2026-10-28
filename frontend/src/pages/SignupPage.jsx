import { useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import AuthLayout, { Field, PasswordField, StrengthMeter, MailIcon, UserIcon } from '../components/AuthLayout.jsx';
import './AuthPage.css';

const MIN_PASSWORD_LENGTH = 6; // same rule as the server

export default function SignupPage() {
  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to="/" replace />;

  const mismatch = confirm.length > 0 && confirm !== password;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError('Please enter your name.');
    if (password.length < MIN_PASSWORD_LENGTH) {
      return setError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters.`);
    }
    if (password !== confirm) return setError('Passwords do not match.');

    setSubmitting(true);
    try {
      await signup(name.trim(), email.trim(), password);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Could not create the account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      title="Create your account"
      subtitle="Track pollution sources in your area."
      footer={<>Already have an account? <Link to="/login">Log in</Link></>}
    >
      <p className="auth-note">This creates a citizen account. Admin access is set up by the system administrator.</p>

      <form onSubmit={handleSubmit}>
        {error && <div className="auth-error" role="alert">{error}</div>}

        <Field
          label="Full name"
          name="name"
          icon={<UserIcon />}
          value={name}
          onChange={setName}
          autoComplete="name"
          placeholder="Your name"
          disabled={submitting}
        />
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
          autoComplete="new-password"
          placeholder="At least 6 characters"
          disabled={submitting}
        >
          <StrengthMeter password={password} />
        </PasswordField>
        <PasswordField
          label="Confirm password"
          name="confirm"
          value={confirm}
          onChange={setConfirm}
          autoComplete="new-password"
          placeholder="Type it again"
          disabled={submitting}
          hint={mismatch ? 'Passwords do not match.' : undefined}
          hintBad
        />

        <button className="auth-submit" type="submit" disabled={submitting}>
          {submitting ? (<><span className="auth-spinner" aria-hidden="true" />Creating account…</>) : 'Create account'}
        </button>
      </form>
    </AuthLayout>
  );
}
