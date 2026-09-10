export default function InfoBanner() {
  return (
    <div className="infobanner">
      <div className="icon">i</div>
      <p>
        <b>How it works:</b> source predictions currently use a rule-based scoring engine on
        PM2.5, PM10, NO₂ and CO. It is designed as a drop-in placeholder for the trained{' '}
        <b>Random Forest</b> model described in our base research (96.9% accuracy, 27
        pollutants) — the next step is training that model on real emission data and swapping
        it into the backend without changing this UI.
      </p>
    </div>
  );
}
