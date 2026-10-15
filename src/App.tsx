import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { AlarmBriefingProvider } from './context/AlarmBriefingContext';
import { ProtectedRoute, PublicOnlyRoute } from './components/routes/ProtectedRoute';
import { AuthScreen } from './components/auth/AuthScreen';
import { AppLayout } from './components/layout/AppLayout';
import { DashboardPage } from './pages/DashboardPage';
import { NutritionPage } from './pages/NutritionPage';
import { WorkoutsPage } from './pages/WorkoutsPage';
import { ProgressPage } from './pages/ProgressPage';
import { ProfilePage } from './pages/ProfilePage';
import { FirebaseConfigModal } from './components/common/FirebaseConfigModal';

export const App: React.FC = () => {
  const [firebaseModalOpen, setFirebaseModalOpen] = useState(false);

  return (
    <ThemeProvider>
      <AuthProvider>
        <AlarmBriefingProvider>
          <Router>
        <Routes>
          {/* Public Authentication Route */}
          <Route
            path="/login"
            element={
              <PublicOnlyRoute>
                <AuthScreen onOpenFirebaseConfig={() => setFirebaseModalOpen(true)} />
              </PublicOnlyRoute>
            }
          />

          {/* Protected Routes inside Responsive Layout Shell */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/workouts" element={<WorkoutsPage />} />
            <Route path="/progress" element={<ProgressPage />} />
            <Route path="/profile" element={<ProfilePage />} />
          </Route>

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>

        {/* Global Firebase Configuration Modal accessible anywhere */}
        <FirebaseConfigModal
          isOpen={firebaseModalOpen}
          onClose={() => setFirebaseModalOpen(false)}
        />
          </Router>
        </AlarmBriefingProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

export default App;
