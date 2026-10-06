import Headline from '../components/Headline.jsx';
import PollutantForm from '../components/PollutantForm.jsx';
import PollutantLevels from '../components/PollutantLevels.jsx';
import TrendChart from '../components/TrendChart.jsx';
import CausePanel from '../components/CausePanel.jsx';
import { useAuth } from '../context/AuthContext.jsx';

export default function AnalysisPage({ inputs, onChange, onSubmit, predicting, activeZone, prediction }) {
  const { isAdmin } = useAuth();
  const zoneName = activeZone ? activeZone.name : 'Custom profile';

  return (
    <>
      <Headline
        eyebrow="Deep dive"
        title="Analyze pollutant patterns"
        subtitle={
          isAdmin
            ? 'Simulate a pollutant profile and inspect the 12-hour trend behind a prediction'
            : 'View the pollution trend and source prediction for the selected zone'
        }
      />
      <section className="lower">
        {isAdmin ? (
          <PollutantForm values={inputs} onChange={onChange} onSubmit={onSubmit} submitting={predicting} />
        ) : (
          <PollutantLevels zone={activeZone} />
        )}
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
