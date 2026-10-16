import React from 'react';
import { HashRouter, Routes, Route, Navigate, useInRouterContext } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Onboarding from './pages/Onboarding';
import Workouts from './pages/Workouts';
import WorkoutPage from './pages/WorkoutPage';
import CheckIn from './pages/CheckIn';
import CalendarPage from './pages/CalendarPage';
import Nutrition from './pages/Nutrition';
import AiCoach from './pages/AiCoach';
import Settings from './pages/Settings';

export const AppRoutes = () => {
  const { currentUser } = useAuth();

  return (
    <Routes>
      {/* Public Login Route - Redirects to dashboard if already authenticated */}
      <Route
        path="/login"
        element={currentUser ? <Navigate to="/" replace /> : <Login />}
      />

      {/* Protected Routes using Responsive AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="profile" element={<Profile />} />
        <Route path="onboarding" element={<Onboarding />} />
        <Route path="workouts" element={<Workouts />} />
        <Route path="workout" element={<WorkoutPage />} />
        <Route path="checkin" element={<CheckIn />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="nutrition" element={<Nutrition />} />
        <Route path="ai-coach" element={<AiCoach />} />
        <Route path="settings" element={<Settings />} />
      </Route>

      {/* Fallback route - Redirect unknown paths to home */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export const App = () => {
  const inRouter = useInRouterContext();

  if (inRouter) {
    return <AppRoutes />;
  }

  return (
    <HashRouter>
      <AppRoutes />
    </HashRouter>
  );
};

export { HashRouter, Routes, Route };
export default App;
