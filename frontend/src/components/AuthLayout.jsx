import { useId, useState } from 'react';

/* ---------- small inline icons (no extra packages) ---------- */
const iconProps = {
  className: 'auth-icon',
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': 'true',
};

export const MailIcon = () => (
  <svg {...iconProps}><rect x="3" y="5" width="18" height="14" rx="2.5" /><path d="m4 7.5 8 5.5 8-5.5" /></svg>
);
export const LockIcon = () => (
  <svg {...iconProps}><rect x="4.5" y="10.5" width="15" height="10" rx="2.5" /><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" /></svg>
);
export const UserIcon = () => (
  <svg {...iconProps}><circle cx="12" cy="8" r="3.8" /><path d="M4.5 20c.8-3.6 3.7-5.5 7.5-5.5s6.7 1.9 7.5 5.5" /></svg>
);
const EyeIcon = () => (
  <svg {...iconProps} className="auth-eye"><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" /><circle cx="12" cy="12" r="2.8" /></svg>
);
const EyeOffIcon = () => (
  <svg {...iconProps} className="auth-eye"><path d="M3 3l18 18" /><path d="M10.6 5.7A9.6 9.6 0 0 1 12 5.5c6 0 9.5 6.5 9.5 6.5a16 16 0 0 1-3.2 3.9M6.4 7.4C3.9 9.1 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.8-.4 4-1" /><path d="M9.9 9.9a2.8 2.8 0 0 0 4.2 3.7" /></svg>
);

/* ---------- form fields ---------- */
export function Field({ label, icon, type = 'text', value, onChange, autoComplete, placeholder, disabled, name }) {
  const id = useId();
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input">
        {icon}
        <input
          id={id}
          name={name}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          required
        />
      </div>
    </div>
  );
}

export function PasswordField({ label, value, onChange, autoComplete, placeholder, disabled, name, hint, hintBad, children }) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  return (
    <div className="auth-field">
      <label htmlFor={id}>{label}</label>
      <div className="auth-input">
        <LockIcon />
        <input
          id={id}
          name={name}
          type={visible ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          placeholder={placeholder}
          disabled={disabled}
          required
        />
        <button
          type="button"
          className="auth-toggle"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
        >
          {visible ? <EyeOffIcon /> : <EyeIcon />}
        </button>
      </div>
      {children}
      {hint && <p className={`auth-hint${hintBad ? ' bad' : ''}`}>{hint}</p>}
    </div>
  );
}

/* ---------- password strength ---------- */
export function passwordStrength(password) {
  if (!password) return { score: 0, label: '' };
  if (password.length < 6) return { score: 1, label: 'Too short' };

  let points = 0;
  if (password.length >= 8) points += 1;
  if (password.length >= 12) points += 1;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) points += 1;
  if (/\d/.test(password)) points += 1;
  if (/[^A-Za-z0-9]/.test(password)) points += 1;

  if (points <= 1) return { score: 2, label: 'Weak' };
  if (points <= 3) return { score: 3, label: 'Fair' };
  return { score: 4, label: 'Strong' };
}

export function StrengthMeter({ password }) {
  if (!password) return null;
  const { score, label } = passwordStrength(password);
  return (
    <div className="auth-strength" data-score={score}>
      <div className="auth-strength-bars" aria-hidden="true">
        {[1, 2, 3, 4].map((n) => (
          <span key={n} className={n <= score ? 'on' : ''} />
        ))}
      </div>
      <span className="auth-strength-label" aria-live="polite">{label}</span>
    </div>
  );
}

/* ---------- page layout: brand panel + form ---------- */
const POINTS = [
  { title: 'See the source', text: 'Traffic, industry, construction dust or background, not just an AQI number.' },
  { title: 'Ask the AI assistant', text: 'It answers from live zone data and remembers your chats.' },
  { title: 'Act on it', text: 'Source-specific actions, and admins can alert the authorities.' },
];

export default function AuthLayout({ title, subtitle, children, footer }) {
  return (
    <div className="auth-shell">
      <aside className="auth-hero">
        <div className="auth-brand">
          <span className="auth-mark" aria-hidden="true">⌁</span>
          <span>AirTrace <b>AI</b></span>
        </div>

        <div className="auth-hero-body">
          <p className="auth-eyebrow">Urban pollution intelligence</p>
          <h2>Find the cause.<br />Target the response.</h2>
          <p className="auth-lead">AQI tells you the air is bad. AirTrace tells you why, where, and what to do about it.</p>
          <ul className="auth-points">
            {POINTS.map((p, i) => (
              <li key={p.title}>
                <i aria-hidden="true">{i + 1}</i>
                <div>
                  <b>{p.title}</b>
                  <span>{p.text}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="auth-scale">
          <div className="auth-scale-bar" aria-hidden="true" />
          <div className="auth-scale-labels"><span>Good</span><span>Severe</span></div>
          <p>Coimbatore · India CPCB AQI scale</p>
        </div>
      </aside>

      <section className="auth-panel">
        <div className="auth-card">
          <h1>{title}</h1>
          <p className="auth-sub">{subtitle}</p>
          {children}
          <p className="auth-footer">{footer}</p>
        </div>
      </section>
    </div>
  );
}
