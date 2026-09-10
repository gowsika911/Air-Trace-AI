import { useEffect, useRef, useState } from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header.jsx';
import NavTabs from './components/NavTabs.jsx';
import Toast from './components/Toast.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import { fetchZones, predictSource } from './api.js';

const DEFAULT_INPUTS = { pm25: 128, pm10: 201, no2: 86, co: 2.1 };

export default function App() {
  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loadingZones, setLoadingZones] = useState(true);
  const [predicting, setPredicting] = useState(false);
  const [inputs, setInputs] = useState(DEFAULT_INPUTS);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimer = useRef(null);

  const showToast = (message) => {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2600);
  };

  // Load zones from the backend on first render.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const data = await fetchZones();
        if (cancelled) return;
        setZones(data);
        const first = data[0];
        setActiveZone(first);
        setPrediction(first.prediction);
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoadingZones(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleSelectZone = (zone) => {
    setActiveZone(zone);
    setPrediction(zone.prediction);
    showToast(`Map updated for ${zone.name}`);
  };

  const handleInputChange = (key, value) => {
    setInputs((prev) => ({ ...prev, [key]: value }));
  };

  const handlePredict = async () => {
    setPredicting(true);
    setError(null);
    try {
      const result = await predictSource(inputs);
      setPrediction(result);
      setActiveZone(null); // custom profile is not tied to a fixed zone
      showToast(`Analysis complete: ${result.source.toLowerCase()} is the likely source`);
    } catch (err) {
      setError(err.message);
      showToast('Analysis failed — check backend connection');
    } finally {
      setPredicting(false);
    }
  };

  return (
    <main className="app">
      <Header />
      <NavTabs />

      <Routes>
        <Route
          path="/"
          element={
            <DashboardPage
              zones={zones}
              activeZone={activeZone}
              prediction={prediction}
              loadingZones={loadingZones}
              error={error}
              onSelectZone={handleSelectZone}
              predicting={predicting}
            />
          }
        />
        <Route
          path="/analysis"
          element={
            <AnalysisPage
              inputs={inputs}
              onChange={handleInputChange}
              onSubmit={handlePredict}
              predicting={predicting}
              activeZone={activeZone}
              prediction={prediction}
            />
          }
        />
      </Routes>

      <div className="footer">
        AirTrace AI <span className="tagline">turns AQI data into actionable environmental intelligence.</span> ·
        React + Node prototype
      </div>

      <Toast message={toast.message} visible={toast.visible} />
    </main>
  );
}
