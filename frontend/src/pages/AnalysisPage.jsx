import Headline from '../components/Headline.jsx';
import TrendChart from '../components/TrendChart.jsx';
import CausePanel from '../components/CausePanel.jsx';

export default function AnalysisPage({ activeZone, prediction }) {
  const zoneName = activeZone ? activeZone.name : 'Selected profile';

  return (
    <>
      <Headline
        eyebrow="Deep dive"
        title="Analyze pollutant patterns"
        subtitle="12-hour trend and the reasoning behind the current prediction"
      />
      <section className="grid">
        <TrendChart
          zoneName={zoneName}
          points={prediction?.trend || []}
          aqi={prediction?.aqi}
          aqiStatus={prediction?.aqiStatus}
        />
        <CausePanel
          aqi={prediction?.aqi}
          aqiStatus={prediction?.aqiStatus}
          source={prediction?.source}
          detail={prediction?.detail}
        />
      </section>
    </>
  );
}
