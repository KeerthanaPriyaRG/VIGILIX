import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { NotificationProvider } from './context/NotificationContext';
import ProtectedRoute from './components/auth/ProtectedRoute';

import AppLayout from './components/layout/AppLayout';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import LogsPage from './pages/LogsPage';
import ThreatsPage from './pages/ThreatsPage';
import IncidentsPage from './pages/IncidentsPage';
import ThreatIntelligencePage from './pages/ThreatIntelligencePage';
import PlaybooksPage from './pages/PlaybooksPage';
import SecurityMaturityPage from './pages/SecurityMaturityPage';
import AttackSimulationPage from './pages/AttackSimulationPage';
import SplunkIntegrationPage from './pages/SplunkIntegrationPage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <AuthProvider>
      <NotificationProvider>
        <BrowserRouter>
          <Routes>
            {/* Public Auth Gateway */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected SOC Routes */}
            <Route element={<ProtectedRoute />}>
              <Route element={<AppLayout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/logs" element={<LogsPage />} />
                <Route path="/threats" element={<ThreatsPage />} />
                <Route path="/incidents" element={<IncidentsPage />} />
                <Route path="/intelligence" element={<ThreatIntelligencePage />} />
                <Route path="/playbooks" element={<PlaybooksPage />} />
                <Route path="/maturity" element={<SecurityMaturityPage />} />
                <Route path="/simulation" element={<AttackSimulationPage />} />
                <Route path="/splunk" element={<SplunkIntegrationPage />} />
                <Route path="/settings" element={<SettingsPage />} />
              </Route>
            </Route>

            {/* Default Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </NotificationProvider>
    </AuthProvider>
  );
}
