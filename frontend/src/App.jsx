import { useCallback, useEffect, useRef, useState } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import Header from './components/Header.jsx';
import NavTabs from './components/NavTabs.jsx';
import Toast from './components/Toast.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import DashboardPage from './pages/DashboardPage.jsx';
import AnalysisPage from './pages/AnalysisPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import SignupPage from './pages/SignupPage.jsx';
import ChatbotPage from './pages/ChatbotPage.jsx';
import ReducePollutionPage from './pages/ReducePollutionPage.jsx';
import AuthoritiesPage from './pages/AuthoritiesPage.jsx';
import AdminPage from './pages/AdminPage.jsx';
import DataFieldsPage from './pages/DataFieldsPage.jsx';
import { fetchZones } from './api.js';
import { useAuth } from './context/AuthContext.jsx';

const REFRESH_INTERVAL_MS = 30000;

export default function App() {
  const { isAuthenticated } = useAuth();
  const location = useLocation();
  const [zones, setZones] = useState([]);
  const [activeZone, setActiveZone] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [loadingZones, setLoadingZones] = useState(true);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState({ message: '', visible: false });
  const toastTimer = useRef(null);

  const showToast = (message) => {
    setToast({ message, visible: true });
    clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast((t) => ({ ...t, visible: false })), 2600);
  };

  // Fetches the latest zone data (e.g. after an admin edit) and keeps the selected zone.
  const refreshZones = useCallback(async () => {
    try {
      const data = await fetchZones();
      setZones(data);
      setActiveZone((current) => (current ? data.find((z) => z.id === current.id) || data[0] || null : data[0] || null));
      setError(null);
    } catch (err) {
      // Show an error only if we have nothing to display yet; ignore a failed background refresh.
      setZones((existing) => {
        if (existing.length === 0) setError(err.message);
        return existing;
      });
    } finally {
      setLoadingZones(false);
    }
  }, []);

  // The prediction always follows the selected zone, so refreshed data updates every page.
  useEffect(() => {
    if (activeZone) setPrediction(activeZone.prediction);
  }, [activeZone]);

  // Load on login, reload whenever the user changes page, and refresh every 30 seconds.
  useEffect(() => {
    if (!isAuthenticated) return undefined;
    refreshZones();
    const timer = setInterval(refreshZones, REFRESH_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [isAuthenticated, location.pathname, refreshZones]);

  const handleSelectZone = (zone) => {
    setActiveZone(zone);
    showToast(`Map updated for ${zone.name}`);
  };

  return (
    <main className="app">
      <Header />
      {isAuthenticated && <NavTabs />}

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <DashboardPage
                zones={zones}
                activeZone={activeZone}
                prediction={prediction}
                loadingZones={loadingZones}
                error={error}
                onSelectZone={handleSelectZone}
                predicting={false}
              />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analysis"
          element={
            <ProtectedRoute>
              <AnalysisPage activeZone={activeZone} prediction={prediction} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/chatbot"
          element={
            <ProtectedRoute>
              <ChatbotPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reduce-pollution"
          element={
            <ProtectedRoute>
              <ReducePollutionPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/authorities"
          element={
            <ProtectedRoute>
              <AuthoritiesPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <ProtectedRoute adminOnly>
              <AdminPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/data-fields"
          element={
            <ProtectedRoute adminOnly>
              <DataFieldsPage />
            </ProtectedRoute>
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
