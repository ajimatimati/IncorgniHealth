import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AvatarGenerator from '../components/AvatarGenerator';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import { User, Stethoscope, Sliders, Database, Download, ChevronRight, Trash2, Clock, AlertTriangle } from 'lucide-react';

export default function Settings() {
  const { user, logout, token, login } = useAuth();
  const toast = useToast();
  const [isOnline, setIsOnline] = useState(user?.isOnline || false);
  const [specialization, setSpecialization] = useState(user?.specialization || '');
  const [saving, setSaving] = useState(false);

  // Preferences (client-side)
  const [prefs, setPrefs] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('userPrefs') || '{}');
    } catch { return {}; }
  });

  const updatePref = (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    localStorage.setItem('userPrefs', JSON.stringify(updated));
  };

  const handleToggleOnline = async () => {
    const newState = !isOnline;
    setIsOnline(newState);
    try {
      await api.put('/user/profile', { isOnline: newState });
      toast.success(newState ? 'You are now visible.' : 'You are now offline.');
    } catch {
      setIsOnline(!newState);
      toast.error('Could not update status.');
    }
  };

  const handleSaveSpecialization = async () => {
    setSaving(true);
    try {
      const res = await api.put('/user/profile', { specialization });
      toast.success('Specialization saved.');
      login(token, { ...user, specialization });
    } catch {
      toast.error('Could not save.');
    } finally {
      setSaving(false);
    }
  };

  const handleClearLocalData = () => {
    const keys = ['moodHistory', 'journalEntries', 'safetyPlan', 'userPrefs', 'discreteMode'];
    keys.forEach(k => localStorage.removeItem(k));
    toast.success('Local data cleared.');
    setPrefs({});
  };

  const handleExportAllData = () => {
    const data = {
      profile: {
        ghostId: user?.publicId,
        role: user?.role,
        nickname: user?.nickname,
      },
      preferences: prefs,
      moodHistory: JSON.parse(localStorage.getItem('moodHistory') || '[]'),
      journalEntries: JSON.parse(localStorage.getItem('journalEntries') || '[]'),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incorgnihealth-export-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported.');
  };

  const specializations = [
    'General Practice', 'Sexual Health', 'Mental Health', 'Dermatology',
    'Gynecology', 'Urology', 'Psychiatry', 'Internal Medicine',
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto relative z-10"
    >
      <h1 className="text-2xl font-bold text-text-primary mb-8">Settings</h1>

      {/* Account info */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <User className="w-5 h-5 text-action" strokeWidth={1.5} />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Account</h2>
        </div>
        <div className="flex items-center gap-4">
          <AvatarGenerator seed={user?.avatar || user?.publicId} size="lg" showStatus isOnline={isOnline} />
          <div>
            <p className="font-mono text-sm font-bold text-action">{user?.publicId}</p>
            <p className="text-xs text-text-muted mt-1 capitalize">{user?.role?.toLowerCase()}</p>
          </div>
        </div>
      </div>

      {/* Doctor options */}
      {user?.role === 'DOCTOR' && (
        <div className="glass-card p-5 mb-6">
          <div className="flex items-center gap-3 mb-4">
            <Stethoscope className="w-5 h-5 text-emerald-400" strokeWidth={1.5} />
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Doctor Settings</h2>
          </div>

          {/* Online toggle */}
          <div className="flex items-center justify-between py-3 border-b border-white/5">
            <div>
              <p className="text-sm font-medium text-text-primary">Availability</p>
              <p className="text-xs text-text-muted mt-0.5">Appear in the queue for new patients</p>
            </div>
            <button
              onClick={handleToggleOnline}
              className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300 ${
                isOnline ? 'bg-emerald-500' : 'bg-surface-alt border border-white/10'
              }`}
            >
              <span
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  isOnline ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Specialization */}
          <div className="py-3">
            <label className="block text-sm font-medium text-text-primary mb-2">Specialization</label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="input-field mb-3"
              style={{ backgroundColor: '#0f1219', color: '#e0e0e0' }}
            >
              <option value="" style={{ backgroundColor: '#0f1219' }}>Select specialization</option>
              {specializations.map(s => (
                <option key={s} value={s} style={{ backgroundColor: '#0f1219' }}>{s}</option>
              ))}
            </select>
            <RippleButton
              onClick={handleSaveSpecialization}
              disabled={saving || !specialization}
              className="text-sm px-4"
            >
              {saving ? 'Saving...' : 'Save'}
            </RippleButton>
          </div>
        </div>
      )}

      {/* Preferences */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Sliders className="w-5 h-5 text-accent-purple" strokeWidth={1.5} />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Preferences</h2>
        </div>

        {/* Notification toggles */}
        {[
          { key: 'notifyPush', label: 'Push Notifications', desc: 'Browser push alerts' },
          { key: 'notifyEmail', label: 'Email Notifications', desc: 'Consultation summaries via email' },
          { key: 'notifyInApp', label: 'In-App Notifications', desc: 'Badge and bell alerts' },
          { key: 'soundEffects', label: 'Sound Effects', desc: 'Chat message sounds' },
        ].map(({ key, label, desc }) => (
          <div key={key} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
            <div>
              <p className="text-sm font-medium text-text-primary">{label}</p>
              <p className="text-xs text-text-muted mt-0.5">{desc}</p>
            </div>
            <button
              onClick={() => updatePref(key, !prefs[key])}
              className={`w-12 h-7 rounded-full flex items-center px-1 transition-colors duration-300 ${
                prefs[key] ? 'bg-action' : 'bg-surface-alt border border-white/10'
              }`}
            >
              <span
                className={`w-5 h-5 bg-white rounded-full shadow-md transition-transform duration-300 ${
                  prefs[key] ? 'translate-x-5' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        ))}
      </div>

      {/* Data & Privacy */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Database className="w-5 h-5 text-amber-400" strokeWidth={1.5} />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Data & Privacy</h2>
        </div>

        <div className="space-y-3">
          <RippleButton
            onClick={handleExportAllData}
            variant="secondary"
            className="w-full flex items-center justify-between px-4 py-3 group"
          >
            <span className="flex items-center gap-3">
              <Download className="w-4 h-4 text-action" strokeWidth={1.8} />
              Export All Data
            </span>
            <ChevronRight className="w-4 h-4 text-text-dim group-hover:text-text-muted transition" strokeWidth={2} />
          </RippleButton>

          <RippleButton
            onClick={handleClearLocalData}
            variant="secondary"
            className="w-full flex items-center justify-between px-4 py-3 group hover:border-red-500/20"
          >
            <span className="flex items-center gap-3 text-red-400">
              <Trash2 className="w-4 h-4" strokeWidth={1.8} />
              Clear Local Data
            </span>
            <ChevronRight className="w-4 h-4 text-red-500/50 group-hover:text-red-400 transition" strokeWidth={2} />
          </RippleButton>
        </div>
      </div>

      {/* Session info */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-cyan-400" strokeWidth={1.5} />
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Session</h2>
        </div>
        <div className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-text-muted">Current session</span>
            <span className="text-emerald-400 flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse-soft" />
              Active
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-text-muted">Login method</span>
            <span className="text-text-secondary">Phone OTP</span>
          </div>
        </div>
      </div>

      {/* Danger zone */}
      <div className="glass-card p-5 border-red-500/20">
        <div className="flex items-center gap-3 mb-4">
          <AlertTriangle className="w-5 h-5 text-red-400" strokeWidth={1.5} />
          <h2 className="text-sm font-bold text-red-400 uppercase tracking-wider">Danger Zone</h2>
        </div>

        <div className="space-y-3">
          <RippleButton
            onClick={() => { logout(); window.location.href = '/auth'; }}
            variant="danger"
            className="w-full text-sm py-3 justify-center"
          >
            Sign Out
          </RippleButton>
          <RippleButton
            onClick={() => toast.info('Account deletion requires contacting support.')}
            variant="secondary"
            className="w-full text-sm py-3 justify-center text-text-dim border-none bg-transparent hover:text-red-400 hover:bg-white/5"
          >
            Delete Account
          </RippleButton>
        </div>
      </div>
    </motion.div>
  );
}
