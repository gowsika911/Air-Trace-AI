import Headline from '../components/Headline.jsx';
import InfoBanner from '../components/InfoBanner.jsx';
import MapCard from '../components/MapCard.jsx';
import ResultCard from '../components/ResultCard.jsx';

export default function DashboardPage({ zones, activeZone, prediction, loadingZones, error, onSelectZone, predicting }) {
  const zoneLabel = activeZone ? `${activeZone.name} monitoring station` : 'Simulated pollutant profile';

  return (
    <>
      <Headline />
      <InfoBanner />

      {error && (
        <p style={{ color: 'var(--red)', marginTop: -10, marginBottom: 16 }}>
          {error} — make sure the backend is running on port 5000.
        </p>
      )}

      <section className="grid">
        {loadingZones ? (
          <div className="card mapcard">
            <p className="sub">Loading zones…</p>
          </div>
        ) : (
          <MapCard zones={zones} activeZoneId={activeZone?.id} onSelectZone={onSelectZone} />
        )}
        <ResultCard zoneLabel={zoneLabel} prediction={prediction} loading={predicting} />
      </section>
    </>
  );
}
