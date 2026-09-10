export default function Header() {
  const now = new Date();
  const formatted = now.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <header className="topbar">
      <div className="brand">
        <div className="brandmark">⌁</div>
        AirTrace <span>AI</span>
      </div>
      <div className="righttop">
        <span>Coimbatore · {formatted}</span>
        <span className="live">
          <i className="dot" />
          LIVE MONITORING
        </span>
      </div>
    </header>
  );
}
