import Headline from '../components/Headline.jsx';
import PollutantForm from '../components/PollutantForm.jsx';
import TrendChart from '../components/TrendChart.jsx';
import CausePanel from '../components/CausePanel.jsx';

export default function AnalysisPage({ inputs, onChange, onSubmit, predicting, activeZone, prediction }) {
  const zoneName = activeZone ? activeZone.name : 'Custom profile';

  return (
    <>
      <Headline
        eyebrow="Deep dive"
        title="Analyze pollutant patterns"
        subtitle="Simulate a pollutant profile and inspect the 12-hour trend behind a prediction"
      />
      <section className="lower">
        <PollutantForm values={inputs} onChange={onChange} onSubmit={onSubmit} submitting={predicting} />
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
