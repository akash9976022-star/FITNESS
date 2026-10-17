import React from 'react';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { currentUser, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col items-center justify-center p-4 text-slate-900 dark:text-slate-100 transition-colors duration-200">
        <div className="relative flex items-center justify-center mb-6">
          <img
            src="./logo.png"
            alt="FitMaintenance AI Logo"
            className="w-16 h-16 rounded-2xl object-cover shadow-xl shadow-emerald-500/20 animate-pulse"
          />
          <Loader2 className="absolute -bottom-2 -right-2 w-6 h-6 text-emerald-500 animate-spin" />
        </div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white mb-1">FitMaintenance AI</h2>
        <p className="text-sm text-slate-500 dark:text-slate-400">Authenticating session...</p>
      </div>
    );
  }

  if (!currentUser) {
    // Redirect to login page and preserve requested path in location state
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
