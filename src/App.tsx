import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Workouts from './pages/Workouts';
import Nutrition from './pages/Nutrition';
import AiCoach from './pages/AiCoach';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';

export const App: React.FC = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public Login Route - Redirects to dashboard if already authenticated */}
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected Routes using HashRouter and Responsive AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="ai-coach" element={<AiCoach />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback route - Redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
