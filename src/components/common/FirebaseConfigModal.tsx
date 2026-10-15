import React, { useState } from 'react';
import { X, Key, Check, AlertCircle, ExternalLink, RefreshCw, Sparkles } from 'lucide-react';
import { isFirebaseConfigured, getStoredFirebaseConfig } from '../../firebase/config';

interface FirebaseConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FirebaseConfigModal: React.FC<FirebaseConfigModalProps> = ({ isOpen, onClose }) => {
  const existing = getStoredFirebaseConfig() || {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: '',
  };

  const [apiKey, setApiKey] = useState(existing.apiKey || '');
  const [authDomain, setAuthDomain] = useState(existing.authDomain || '');
  const [projectId, setProjectId] = useState(existing.projectId || '');
  const [storageBucket, setStorageBucket] = useState(existing.storageBucket || '');
  const [messagingSenderId, setMessagingSenderId] = useState(existing.messagingSenderId || '');
  const [appId, setAppId] = useState(existing.appId || '');
  const [jsonPaste, setJsonPaste] = useState('');
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleJsonPaste = (text: string) => {
    setJsonPaste(text);
    try {
      // Try to parse JS or JSON object pasted from Firebase console
      const cleanJson = text
        .replace(/const\s+firebaseConfig\s*=\s*/, '')
        .replace(/;/g, '')
        .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?:/g, '"$2":')
        .replace(/'/g, '"');
      const parsed = JSON.parse(cleanJson);
      if (parsed.apiKey) setApiKey(parsed.apiKey);
      if (parsed.authDomain) setAuthDomain(parsed.authDomain);
      if (parsed.projectId) setProjectId(parsed.projectId);
      if (parsed.storageBucket) setStorageBucket(parsed.storageBucket);
      if (parsed.messagingSenderId) setMessagingSenderId(parsed.messagingSenderId);
      if (parsed.appId) setAppId(parsed.appId);
      setSuccessMsg('Pasted configuration detected and populated!');
    } catch (e) {
      // not valid json yet, let user continue typing
    }
  };

  const handleSave = () => {
    const configToSave = {
      apiKey: apiKey.trim(),
      authDomain: authDomain.trim(),
      projectId: projectId.trim(),
      storageBucket: storageBucket.trim(),
      messagingSenderId: messagingSenderId.trim(),
      appId: appId.trim(),
    };

    if (configToSave.apiKey) {
      localStorage.setItem('fitmaintenance_firebase_config', JSON.stringify(configToSave));
      setSuccessMsg('Firebase config saved! Reloading application to re-initialize...');
      setTimeout(() => {
        window.location.reload();
      }, 900);
    } else {
      localStorage.removeItem('fitmaintenance_firebase_config');
      setSuccessMsg('Reset to default/demo mode. Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 700);
    }
  };

  const handleResetToDemo = () => {
    localStorage.removeItem('fitmaintenance_firebase_config');
    setSuccessMsg('Switched back to local demo mode. Reloading...');
    setTimeout(() => {
      window.location.reload();
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="w-full max-w-lg glass-panel bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl p-6 relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-9 h-9 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400">
            <Key className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Firebase Authentication Setup</h3>
            <p className="text-xs text-slate-400">Connect your live Firebase Project or use Demo mode</p>
          </div>
        </div>

        {/* Current Status banner */}
        <div className={`p-3.5 rounded-xl mb-4 border text-xs flex items-center gap-2.5 ${
          isFirebaseConfigured
            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
            : 'bg-amber-500/10 border-amber-500/30 text-amber-300'
        }`}>
          {isFirebaseConfigured ? (
            <Check className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
          )}
          <div>
            <div className="font-semibold">
              {isFirebaseConfigured ? 'Live Firebase Config Active' : 'Running in Interactive Demo Mode'}
            </div>
            <div className="text-[11px] text-slate-400 mt-0.5">
              {isFirebaseConfigured
                ? 'Authentication is powered directly by your connected Firebase project.'
                : 'You can test the entire app instantly without keys, or paste your Firebase config below.'}
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="p-3 rounded-xl bg-brand-500/20 border border-brand-500/40 text-brand-300 text-xs mb-4 flex items-center gap-2">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-brand-400" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Fast snippet paste */}
        <div className="mb-4">
          <label className="block text-xs font-semibold text-slate-300 mb-1.5 flex justify-between">
            <span>Paste Firebase Config snippet (Optional)</span>
            <a
              href="https://console.firebase.google.com"
              target="_blank"
              rel="noreferrer"
              className="text-[11px] text-brand-400 hover:underline inline-flex items-center gap-1"
            >
              Firebase Console <ExternalLink className="w-3 h-3" />
            </a>
          </label>
          <textarea
            rows={2}
            value={jsonPaste}
            onChange={(e) => handleJsonPaste(e.target.value)}
            placeholder='Paste { apiKey: "...", authDomain: "..." } from Firebase console'
            className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 font-mono focus:outline-none focus:border-brand-500"
          />
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-5">
          <div>
            <label className="text-slate-400 font-medium block mb-1">API Key</label>
            <input
              type="text"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="AIzaSy..."
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 font-medium block mb-1">Auth Domain</label>
            <input
              type="text"
              value={authDomain}
              onChange={(e) => setAuthDomain(e.target.value)}
              placeholder="project-id.firebaseapp.com"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 font-medium block mb-1">Project ID</label>
            <input
              type="text"
              value={projectId}
              onChange={(e) => setProjectId(e.target.value)}
              placeholder="project-id"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="text-slate-400 font-medium block mb-1">App ID</label>
            <input
              type="text"
              value={appId}
              onChange={(e) => setAppId(e.target.value)}
              placeholder="1:123456:web:abcd"
              className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-lg text-white font-mono text-xs focus:border-brand-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-2 pt-2 border-t border-slate-800">
          <button
            type="button"
            onClick={handleSave}
            className="flex-1 py-2.5 px-4 bg-brand-500 hover:bg-brand-400 text-slate-950 font-bold rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5 shadow-glow"
          >
            <Check className="w-4 h-4" />
            <span>Save & Connect Firebase</span>
          </button>
          <button
            type="button"
            onClick={handleResetToDemo}
            className="py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium rounded-xl text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Use Demo Mode</span>
          </button>
        </div>
      </div>
    </div>
  );
};
