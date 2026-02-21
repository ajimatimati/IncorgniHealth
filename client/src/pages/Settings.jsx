import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AvatarGenerator from '../components/AvatarGenerator';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';

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
          <svg className="w-5 h-5 text-action" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
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
            <svg className="w-5 h-5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47" />
            </svg>
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
          <svg className="w-5 h-5 text-accent-purple" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 6h9.75M10.5 6a1.5 1.5 0 11-3 0m3 0a1.5 1.5 0 10-3 0M3.75 6H7.5m3 12h9.75m-9.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-3.75 0H7.5m9-6h3.75m-3.75 0a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m-9.75 0h9.75" />
          </svg>
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
          <svg className="w-5 h-5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" />
          </svg>
          <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Data & Privacy</h2>
        </div>

        <div className="space-y-3">
          <RippleButton
            onClick={handleExportAllData}
            variant="secondary"
            className="w-full flex items-center justify-between px-4 py-3 group"
          >
            <span className="flex items-center gap-3">
              <svg className="w-4 h-4 text-action" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
              Export All Data
            </span>
            <svg className="w-4 h-4 text-text-dim group-hover:text-text-muted transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </RippleButton>

          <RippleButton
            onClick={handleClearLocalData}
            variant="secondary"
            className="w-full flex items-center justify-between px-4 py-3 group hover:border-red-500/20"
          >
            <span className="flex items-center gap-3 text-red-400">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
              Clear Local Data
            </span>
            <svg className="w-4 h-4 text-red-500/50 group-hover:text-red-400 transition" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
            </svg>
          </RippleButton>
        </div>
      </div>

      {/* Session info */}
      <div className="glass-card p-5 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
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
          <svg className="w-5 h-5 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
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
