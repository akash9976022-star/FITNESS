import React from 'react';
import ReactDOM from 'react-dom/client';
import { HashRouter } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { Capacitor } from '@capacitor/core';
import App from './App';
import './index.css';

// Apply native platform class for status-bar and notch safe area insets
if (typeof window !== 'undefined' && Capacitor.isNativePlatform()) {
  document.documentElement.classList.add('is-native');
  if (Capacitor.getPlatform() === 'android') {
    document.documentElement.classList.add('is-android');
  }
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ThemeProvider>
      <HashRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </HashRouter>
    </ThemeProvider>
  </React.StrictMode>
);
