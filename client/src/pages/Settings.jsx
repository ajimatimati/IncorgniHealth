import { useState, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AvatarGenerator from '../components/AvatarGenerator';
import { motion, AnimatePresence } from 'framer-motion';

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
      await api.put('/user/profile', { specialization });
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

  const TABS = useMemo(() => {
    const tabs = [
      { id: 'account', label: 'Account Overview', icon: 'person' },
      ...(user?.role === 'DOCTOR' ? [{ id: 'doctor', label: 'Doctor Profile', icon: 'stethoscope' }] : []),
      { id: 'preferences', label: 'Preferences', icon: 'tune' },
      { id: 'privacy', label: 'Data & Privacy', icon: 'database' },
      { id: 'session', label: 'Session Management', icon: 'schedule' },
      { id: 'danger', label: 'Danger Zone', icon: 'warning' },
    ];
    return tabs;
  }, [user?.role]);

  const [activeTab, setActiveTab] = useState(TABS[0].id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="bg-background min-h-full text-on-background"
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        {/* Page Header */}
        <header className="mb-8">
          <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em]">Configuration</p>
          <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface mt-1">Settings</h1>
          <p className="font-body text-base text-on-surface-variant mt-2 opacity-90 max-w-xl">
            Manage your account preferences, configure local device settings, and control your private data footprint.
          </p>
        </header>

        {/* High-Density Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Vertical Tab Navigation */}
          <nav className="w-full lg:w-64 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-start gap-4 h-14 lg:h-auto lg:py-4 px-6 lg:px-5 rounded-[20px] lg:rounded-2xl shrink-0 transition-all ${
                  activeTab === tab.id
                    ? tab.id === 'danger' 
                        ? 'bg-error/10 text-error shadow-sm'
                        : 'bg-surface-container-highest text-on-surface shadow-sm'
                    : 'bg-surface-container-low border border-outline-variant/5 text-outline hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${activeTab === tab.id ? (tab.id === 'danger' ? 'text-error' : 'text-primary') : ''}`}>
                  {tab.icon}
                </span>
                <span className="font-label text-[10px] uppercase tracking-widest text-left whitespace-nowrap">
                  {tab.label}
                </span>
              </button>
            ))}
          </nav>

          {/* Right Content Pane */}
          <div className="flex-1 w-full min-h-[400px]">
            <AnimatePresence mode="wait">
              {/* Account Overview */}
              {activeTab === 'account' && (
                <motion.section
                  key="account"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/5 pb-6">
                      <span className="material-symbols-outlined text-primary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                      <div>
                        <h2 className="font-headline text-lg font-bold text-on-surface">Account Overview</h2>
                        <p className="font-body text-xs text-on-surface-variant mt-1">Your core identity properties</p>
                      </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 bg-surface-container rounded-3xl p-6 border border-outline-variant/5">
                      <AvatarGenerator seed={user?.avatar || user?.publicId} size="xl" showStatus isOnline={isOnline} />
                      <div className="text-center sm:text-left">
                        <p className="font-label text-[10px] text-outline uppercase tracking-widest mb-1">Assigned Public ID</p>
                        <p className="font-headline text-2xl font-bold text-on-surface font-mono tracking-tight">{user?.publicId}</p>
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                          <span className="font-label text-[10px] text-primary uppercase tracking-widest">{user?.role}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Doctor Settings */}
              {activeTab === 'doctor' && user?.role === 'DOCTOR' && (
                <motion.section
                  key="doctor"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/5 pb-6">
                      <span className="material-symbols-outlined text-tertiary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>stethoscope</span>
                      <div>
                        <h2 className="font-headline text-lg font-bold text-on-surface">Doctor Settings</h2>
                        <p className="font-body text-xs text-on-surface-variant mt-1">Manage your clinical presence</p>
                      </div>
                    </div>

                    <div className="space-y-6">
                      {/* Online toggle */}
                      <div className="flex items-center justify-between p-6 bg-surface-container rounded-[24px] border border-outline-variant/5">
                        <div>
                          <p className="font-headline text-sm font-bold text-on-surface">Availability Status</p>
                          <p className="font-body text-sm text-on-surface-variant mt-1 opacity-80">Toggle to appear in the active queue for incoming consultations.</p>
                        </div>
                        <button
                          onClick={handleToggleOnline}
                          className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors duration-300 shrink-0 ${
                            isOnline ? 'bg-tertiary' : 'bg-surface-container-highest border border-outline-variant/20'
                          }`}
                        >
                          <span
                            className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                              isOnline ? 'translate-x-6' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Specialization */}
                      <div className="p-6 bg-surface-container rounded-[24px] border border-outline-variant/5">
                        <label className="block font-label text-[10px] text-outline uppercase tracking-widest mb-3">Clinical Specialization</label>
                        <div className="flex flex-col sm:flex-row gap-3">
                          <select
                            value={specialization}
                            onChange={(e) => setSpecialization(e.target.value)}
                            className="flex-1 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-tertiary/40 focus:outline-none transition-all appearance-none cursor-pointer"
                          >
                            <option value="">Select your specialization</option>
                            {specializations.map(s => (
                              <option key={s} value={s}>{s}</option>
                            ))}
                          </select>
                          <button
                            onClick={handleSaveSpecialization}
                            disabled={saving || !specialization}
                            className="h-14 px-8 rounded-2xl bg-tertiary text-on-tertiary font-label text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-40 shrink-0"
                          >
                            {saving ? 'Saving...' : 'Update Details'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Preferences */}
              {activeTab === 'preferences' && (
                <motion.section
                  key="preferences"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/5 pb-6">
                      <span className="material-symbols-outlined text-secondary text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>tune</span>
                      <div>
                        <h2 className="font-headline text-lg font-bold text-on-surface">Application Preferences</h2>
                        <p className="font-body text-xs text-on-surface-variant mt-1">Customize your local experience</p>
                      </div>
                    </div>

                    <div className="space-y-3">
                      {[
                        { key: 'notifyPush', label: 'Push Notifications', desc: 'Receive secure browser push alerts for messages.' },
                        { key: 'notifyEmail', label: 'Email Summaries', desc: 'Get daily encrypted summaries of consultation logs.' },
                        { key: 'notifyInApp', label: 'In-App Notifications', desc: 'Show visual badge and bell alerts while active.' },
                        { key: 'soundEffects', label: 'Sound Effects', desc: 'Play discreet notification sounds for chat.' },
                      ].map(({ key, label, desc }) => (
                        <div key={key} className="flex items-center justify-between p-5 bg-surface-container rounded-[20px] border border-outline-variant/5 hover:border-outline-variant/10 transition-colors">
                          <div className="pr-6">
                            <p className="font-headline text-sm font-bold text-on-surface">{label}</p>
                            <p className="font-body text-sm text-on-surface-variant mt-1 opacity-80 leading-relaxed">{desc}</p>
                          </div>
                          <button
                            onClick={() => updatePref(key, !prefs[key])}
                            className={`w-14 h-8 rounded-full flex items-center px-1 transition-colors duration-300 shrink-0 ${
                              prefs[key] ? 'bg-primary' : 'bg-surface-container-highest border border-outline-variant/20'
                            }`}
                          >
                            <span
                              className={`w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${
                                prefs[key] ? 'translate-x-6' : 'translate-x-0'
                              }`}
                            />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Privacy */}
              {activeTab === 'privacy' && (
                <motion.section
                  key="privacy"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/5 pb-6">
                      <span className="material-symbols-outlined text-outline text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>database</span>
                      <div>
                        <h2 className="font-headline text-lg font-bold text-on-surface">Data & Privacy Control</h2>
                        <p className="font-body text-xs text-on-surface-variant mt-1">Manage local storage and exports</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-5">
                      <div className="p-6 bg-surface-container rounded-[24px] border border-outline-variant/5">
                        <span className="material-symbols-outlined text-primary mb-3">download</span>
                        <h3 className="font-headline text-base font-bold text-on-surface mb-2">Export Local Data</h3>
                        <p className="font-body text-sm text-on-surface-variant mb-6 opacity-80 h-10">Export a JSON file containing all locally cached preferences, drafts, and mood history.</p>
                        <button
                          onClick={handleExportAllData}
                          className="w-full h-12 rounded-xl bg-primary text-on-primary font-label text-[10px] uppercase tracking-widest hover:brightness-110 transition-all font-bold"
                        >
                          Export Data Dump
                        </button>
                      </div>

                      <div className="p-6 bg-surface-container rounded-[24px] border border-outline-variant/5">
                        <span className="material-symbols-outlined text-error mb-3">delete_sweep</span>
                        <h3 className="font-headline text-base font-bold text-on-surface mb-2">Purge Local Data</h3>
                        <p className="font-body text-sm text-on-surface-variant mb-6 opacity-80 h-10">Wipe all cached data stored by this browser. Does not affect your server-side identity.</p>
                        <button
                          onClick={handleClearLocalData}
                          className="w-full h-12 rounded-xl bg-error/10 text-error font-label text-[10px] uppercase tracking-widest hover:bg-error hover:text-white transition-all font-bold"
                        >
                          Clear Browser Data
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Session */}
              {activeTab === 'session' && (
                <motion.section
                  key="session"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-8 shadow-sm">
                    <div className="flex items-center gap-3 mb-6 border-b border-outline-variant/5 pb-6">
                      <span className="material-symbols-outlined text-outline text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>schedule</span>
                      <div>
                        <h2 className="font-headline text-lg font-bold text-on-surface">Session Detail</h2>
                        <p className="font-body text-xs text-on-surface-variant mt-1">Connection and active state info</p>
                      </div>
                    </div>

                    <div className="space-y-4 max-w-xl">
                      <div className="flex items-center justify-between p-5 bg-surface-container rounded-2xl border border-outline-variant/5">
                        <span className="font-body text-sm font-semibold text-on-surface">Status</span>
                        <span className="font-label text-[10px] uppercase tracking-widest text-primary flex items-center gap-2 bg-primary/10 px-3 py-1 rounded-full">
                          <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse" />
                          Authenticated
                        </span>
                      </div>
                      
                      <div className="flex items-center justify-between p-5 bg-surface-container rounded-2xl border border-outline-variant/5">
                        <span className="font-body text-sm font-semibold text-on-surface">Auth Mechanism</span>
                        <span className="font-mono text-xs text-on-surface-variant bg-surface-container-highest px-3 py-1 rounded-lg">
                          Zero-Knowledge OTP
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Danger Zone */}
              {activeTab === 'danger' && (
                <motion.section
                  key="danger"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-error/5 border border-error/20 rounded-[32px] p-8 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-error" />
                    <div className="flex items-center gap-3 mb-6 border-b border-error/10 pb-6">
                      <span className="material-symbols-outlined text-error text-[28px]" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                      <div>
                        <h2 className="font-headline text-lg font-bold text-error">Danger Zone</h2>
                        <p className="font-body text-xs text-error/70 mt-1">Irreversible account actions</p>
                      </div>
                    </div>

                    <div className="space-y-4 max-w-md">
                      <button
                        onClick={() => { logout(); window.location.href = '/auth'; }}
                        className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl bg-error text-on-error font-label text-[11px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all shadow-md shadow-error/20"
                      >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        Sign Out Session
                      </button>
                      
                      <button
                        onClick={() => toast.info('Account deletion requires a secure hand-off request via Support.')}
                        className="w-full flex items-center justify-center gap-2 h-14 rounded-2xl border border-error/20 text-error font-label text-[11px] uppercase tracking-widest hover:bg-error/10 transition-all font-bold"
                      >
                        <span className="material-symbols-outlined text-lg">person_remove</span>
                        Request Complete Deletion
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}

            </AnimatePresence>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
