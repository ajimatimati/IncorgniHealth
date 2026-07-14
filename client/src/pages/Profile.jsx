import { useState, useEffect, useMemo, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AvatarGenerator from '../components/AvatarGenerator';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';

function generateAvatarSeeds(publicId) {
  const base = publicId || 'anon';
  return Array.from({ length: 12 }, (_, i) => `${base}-v${i}`);
}

const ROLE_LABELS = {
  PATIENT: 'Client',
  DOCTOR: 'Physician',
  PHARMACIST: 'Pharmacy',
  RIDER: 'Rider',
  ADMIN: 'Admin',
  SARC_OFFICER: 'SARC Officer',
};

export default function Profile() {
  const { user, login, token, logout } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [erasing, setErasing] = useState(false);
  const [form, setForm] = useState({
    nickname: '',
    avatar: '',
    age: '',
    sex: '',
    language: 'English',
    sosNumber: ''
  });
  const [txHistory, setTxHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('identity');
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);

  const avatarSeeds = useMemo(() => generateAvatarSeeds(user?.publicId), [user?.publicId]);

  const loadProfileAndHistory = useCallback(async (showLoading = false) => {
    if (showLoading) setLoading(true);
    try {
      const [profileRes, historyRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/payments/history'),
      ]);
      setProfile(profileRes.data);
      setForm({
        nickname: profileRes.data.nickname || '',
        avatar: profileRes.data.avatar || '',
        age: profileRes.data.age || '',
        sex: profileRes.data.sex || '',
        language: localStorage.getItem('incognicare_language') || 'English',
        sosNumber: localStorage.getItem('incognicare_sos_number') || '',
      });
      setTxHistory(historyRes.data?.data || historyRes.data || []);
    } catch {
      toast.error('Unable to load data.');
    } finally {
      if (showLoading) setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    loadProfileAndHistory(true);
  }, [loadProfileAndHistory]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { language, sosNumber, ...dbPayload } = form;
      const payload = Object.fromEntries(
        Object.entries(dbPayload).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      const res = await api.put('/user/profile', payload);
      
      localStorage.setItem('incognicare_language', form.language || 'English');
      localStorage.setItem('incognicare_sos_number', form.sosNumber || '');

      toast.success('Profile updated securely.');
      const updatedUser = { ...user, ...(res.data.user ?? res.data) };
      login(token, updatedUser);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadData = () => {
    const data = {
      ghostId: profile?.publicId,
      nickname: form.nickname,
      avatar: form.avatar,
      age: form.age,
      sex: form.sex,
      role: profile?.role,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `incognicare-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported.');
  };

  const handleErase = async () => {
    if (!window.confirm("WARNING: This will permanently delete all your profile records and empty your wallet balance. This action cannot be undone. Are you sure you want to proceed?")) {
      return;
    }
    setErasing(true);
    try {
      await api.post('/user/erase');
      toast.success('Your identity has been completely erased.');
      logout();
      window.location.replace('/auth');
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Failed to erase identity.');
      setErasing(false);
    }
  };

  const fields = ['nickname', 'avatar', 'age', 'sex'];
  const filled = fields.filter(f => form[f] && String(form[f]).trim()).length;
  const completeness = Math.round((filled / fields.length) * 100);

  if (loading) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-outline-variant/20 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  const TABS = [
    { id: 'identity', label: 'Identity', icon: 'person' },
    { id: 'ledger', label: 'Ledger', icon: 'receipt_long' },
    { id: 'privacy', label: 'Privacy', icon: 'lock' },
  ];

  return (
    <div className="bg-background min-h-full text-on-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        {/* Page Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em]">Ghost Identity</p>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface mt-1">Profile</h1>
          </div>
          <button
            onClick={handleDownloadData}
            className="flex items-center gap-2 h-10 px-5 rounded-full bg-surface-container-high border border-outline-variant/10 text-on-surface-variant hover:bg-surface-container-highest transition-all"
          >
            <span className="material-symbols-outlined text-lg">download</span>
            <span className="font-label text-[9px] uppercase tracking-widest hidden sm:block">Export</span>
          </button>
        </header>

        {/* Ghost ID Card */}
        <section className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-8 mb-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent" />
          <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/5 blur-3xl rounded-full pointer-events-none" />

          <p className="font-label text-[9px] text-primary uppercase tracking-[0.2em] mb-6">Ghost Identity Card</p>

          <div className="flex items-start gap-5 relative z-10">
            <div className="relative">
              <AvatarGenerator seed={form.avatar || user?.publicId} size="lg" />
              <span className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                <span className="material-symbols-outlined text-on-primary" style={{ fontSize: '12px' }}>check</span>
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-body text-lg font-bold text-on-surface truncate">{form.nickname || 'Anonymous'}</p>
              <span className="inline-block mt-1 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 font-label text-[9px] text-primary uppercase tracking-widest">
                {ROLE_LABELS[profile?.role] || profile?.role}
              </span>
              <div className="mt-4">
                <p className="font-label text-[8px] text-outline uppercase tracking-widest mb-1">Public ID</p>
                <p className="font-headline text-xs text-on-surface font-mono opacity-50 truncate">{profile?.publicId}</p>
              </div>
            </div>
          </div>

          {/* Completeness Bar */}
          <div className="mt-8 pt-6 border-t border-outline-variant/5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-label text-[9px] text-outline uppercase tracking-widest">Profile Completeness</span>
              <span className="font-headline text-sm font-black text-on-surface">{completeness}%</span>
            </div>
            <div className="h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${completeness}%` }}
                transition={{ duration: 0.8 }}
                className="h-full bg-primary rounded-full"
              />
            </div>
          </div>
        </section>

        {/* High-Density Layout */}
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
          
          {/* Vertical Tab Navigation */}
          <nav className="w-full lg:w-56 shrink-0 flex lg:flex-col gap-2 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center justify-start gap-4 h-14 lg:h-auto lg:py-4 px-6 lg:px-5 rounded-[20px] lg:rounded-2xl shrink-0 transition-all ${
                  activeTab === tab.id
                    ? 'bg-surface-container-highest text-on-surface shadow-md'
                    : 'bg-surface-container-low border border-outline-variant/5 text-outline hover:text-on-surface hover:bg-surface-container'
                }`}
              >
                <span className={`material-symbols-outlined text-[18px] ${activeTab === tab.id ? 'text-primary' : ''}`}>
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
              {/* Identity Tab */}
              {activeTab === 'identity' && (
                <motion.section
                  key="identity"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-sm">
                    {/* Nickname */}
                    <div className="space-y-2">
                      <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Display Name</label>
                      <input
                        type="text"
                        value={form.nickname}
                        onChange={e => setForm(f => ({ ...f, nickname: e.target.value }))}
                        placeholder="What should we call you?"
                        className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary/40 focus:outline-none transition-all hover:border-outline-variant/20"
                      />
                    </div>

                    {/* Avatar Picker */}
                    <div className="space-y-4">
                      <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Select Presets or Customise</label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                        {avatarSeeds.map(seed => (
                          <button
                            key={seed}
                            type="button"
                            onClick={() => setForm(f => ({ ...f, avatar: seed }))}
                            className={`aspect-square rounded-[20px] flex items-center justify-center p-1 border transition-all ${
                              form.avatar === seed
                                ? 'border-primary shadow-lg shadow-primary/20 bg-primary/10 scale-105'
                                : 'border-outline-variant/10 bg-surface-container hover:border-primary/20 hover:bg-surface-container-high'
                            }`}
                          >
                            <AvatarGenerator seed={seed} size="md" />
                          </button>
                        ))}
                      </div>

                      {/* Custom Avatar Designer Sub-Card */}
                      <div className="bg-surface-container/50 border border-outline-variant/10 rounded-2xl p-5 space-y-4 mt-4">
                        <p className="font-mono text-[9px] text-outline uppercase tracking-wider font-semibold">Custom Avatar Designer</p>
                        
                        {/* Seed Input */}
                        <div className="space-y-1.5">
                          <label className="font-label text-[8px] text-outline uppercase tracking-wider pl-1">Aesthetic Seed Word</label>
                          <input
                            type="text"
                            value={form.avatar?.startsWith('{') ? (JSON.parse(form.avatar).seed || '') : form.avatar}
                            onChange={(e) => {
                              const currentVal = form.avatar?.startsWith('{') ? JSON.parse(form.avatar) : { seed: form.avatar || 'user', paletteIndex: 0, shapeCount: 4, centerSize: 15 };
                              setForm(f => ({ ...f, avatar: JSON.stringify({ ...currentVal, seed: e.target.value }) }));
                            }}
                            placeholder="Type a word to randomize shapes..."
                            className="w-full bg-background border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs text-on-surface focus:outline-none focus:border-primary"
                          />
                        </div>

                        {/* Palette Selector */}
                        <div className="space-y-1.5">
                          <label className="font-label text-[8px] text-outline uppercase tracking-wider pl-1">Color Palette</label>
                          <div className="flex flex-wrap gap-2">
                            {[
                              'linear-gradient(135deg, #00f2fe 0%, #4facfe 100%)',
                              'linear-gradient(135deg, #a0c4ff 0%, #c0fdff 100%)',
                              'linear-gradient(135deg, #10b981 0%, #34d399 100%)',
                              'linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%)',
                              'linear-gradient(135deg, #add8e6 0%, #87ceeb 100%)',
                              'linear-gradient(135deg, #06b6d4 0%, #22d3ee 100%)',
                              'linear-gradient(135deg, #e6f0fa 0%, #b0c4de 100%)',
                              'linear-gradient(135deg, #ef4444 0%, #f87171 100%)',
                              'linear-gradient(135deg, #3b82f6 0%, #60a5fa 100%)',
                              'linear-gradient(135deg, #14b8a6 0%, #2dd4bf 100%)',
                            ].map((grad, idx) => {
                              const currentVal = form.avatar?.startsWith('{') ? JSON.parse(form.avatar) : { seed: form.avatar || 'user', paletteIndex: 0, shapeCount: 4, centerSize: 15 };
                              const isActive = currentVal.paletteIndex === idx;
                              return (
                                <button
                                  key={idx}
                                  type="button"
                                  onClick={() => setForm(f => ({ ...f, avatar: JSON.stringify({ ...currentVal, paletteIndex: idx }) }))}
                                  className={`w-6 h-6 rounded-full border transition-all ${
                                    isActive ? 'border-white scale-110 shadow-lg ring-1 ring-white/20' : 'border-transparent opacity-75 hover:opacity-100'
                                  }`}
                                  style={{ background: grad }}
                                  title={`Palette ${idx + 1}`}
                                />
                              );
                            })}
                          </div>
                        </div>

                        {/* Shape Density Slider & Center Size Slider */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center pr-1">
                              <label className="font-label text-[8px] text-outline uppercase tracking-wider pl-1">Shape Density</label>
                              <span className="font-mono text-[8px] text-primary">{form.avatar?.startsWith('{') ? (JSON.parse(form.avatar).shapeCount || 4) : 4}</span>
                            </div>
                            <input
                              type="range"
                              min="3"
                              max="8"
                              value={form.avatar?.startsWith('{') ? (JSON.parse(form.avatar).shapeCount || 4) : 4}
                              onChange={(e) => {
                                const currentVal = form.avatar?.startsWith('{') ? JSON.parse(form.avatar) : { seed: form.avatar || 'user', paletteIndex: 0, shapeCount: 4, centerSize: 15 };
                                setForm(f => ({ ...f, avatar: JSON.stringify({ ...currentVal, shapeCount: Number(e.target.value) }) }));
                              }}
                              className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>

                          <div className="space-y-1.5">
                            <div className="flex justify-between items-center pr-1">
                              <label className="font-label text-[8px] text-outline uppercase tracking-wider pl-1">Focal Size</label>
                              <span className="font-mono text-[8px] text-primary">{form.avatar?.startsWith('{') ? (JSON.parse(form.avatar).centerSize || 15) : 15}px</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="30"
                              value={form.avatar?.startsWith('{') ? (JSON.parse(form.avatar).centerSize || 15) : 15}
                              onChange={(e) => {
                                const currentVal = form.avatar?.startsWith('{') ? JSON.parse(form.avatar) : { seed: form.avatar || 'user', paletteIndex: 0, shapeCount: 4, centerSize: 15 };
                                setForm(f => ({ ...f, avatar: JSON.stringify({ ...currentVal, centerSize: Number(e.target.value) }) }));
                              }}
                              className="w-full h-1 bg-surface-container rounded-lg appearance-none cursor-pointer accent-primary"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Age & Sex */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Age</label>
                        <input
                          type="number"
                          value={form.age}
                          onChange={e => setForm(f => ({ ...f, age: e.target.value }))}
                          placeholder="Age"
                          min="13" max="120"
                          className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary/40 focus:outline-none transition-all hover:border-outline-variant/20"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Sex</label>
                        <select
                          value={form.sex}
                          onChange={e => setForm(f => ({ ...f, sex: e.target.value }))}
                          className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary/40 focus:outline-none transition-all appearance-none cursor-pointer hover:border-outline-variant/20"
                        >
                          <option value="">Prefer not to say</option>
                          <option value="Male">Male</option>
                          <option value="Female">Female</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>

                    {/* Localized Preferences */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Communication Dialect</label>
                        <select
                          value={form.language}
                          onChange={e => setForm(f => ({ ...f, language: e.target.value }))}
                          className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary/40 focus:outline-none transition-all appearance-none cursor-pointer hover:border-outline-variant/20"
                        >
                          <option value="English">English</option>
                          <option value="Pidgin">Nigerian Pidgin</option>
                          <option value="Yoruba">Yoruba</option>
                          <option value="Hausa">Hausa</option>
                          <option value="Igbo">Igbo</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Custom Panic SOS Number</label>
                        <input
                          type="tel"
                          value={form.sosNumber}
                          onChange={e => setForm(f => ({ ...f, sosNumber: e.target.value }))}
                          placeholder="e.g. +234 803 123 4567"
                          className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-4 text-sm text-on-surface focus:border-primary/40 focus:outline-none transition-all hover:border-outline-variant/20"
                        />
                      </div>
                    </div>

                    <div className="pt-2 flex flex-col sm:flex-row justify-between items-center gap-4 border-t border-outline-variant/5 mt-4">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full lg:w-auto px-8 btn-primary h-14 text-[11px]"
                      >
                        {saving ? 'Saving Changes...' : 'Save Identity Preferences'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          localStorage.removeItem('dashboard_tour_completed');
                          toast.success('Onboarding tour has been reset. Return home to launch.');
                        }}
                        className="w-full lg:w-auto px-6 h-14 bg-surface-container border border-outline-variant/10 text-on-surface hover:bg-surface-container-high rounded-full font-label text-[10px] uppercase tracking-wider font-bold transition-all"
                      >
                        Reset Tour Guide
                      </button>
                    </div>
                  </div>
                </motion.section>
              )}

              {/* Ledger Tab */}
              {activeTab === 'ledger' && (
                <motion.section
                  key="ledger"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* Wallet Balance Card */}
                  <div className="bg-gradient-to-br from-[#1c1b22] to-[#121115] border border-outline-variant/20 rounded-[2rem] p-6 relative overflow-hidden group shadow-card-md">
                    <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[80px] pointer-events-none" />
                    <div className="flex flex-col relative z-10">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="material-symbols-outlined text-primary text-base">account_balance_wallet</span>
                          <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">Wallet Balance</p>
                        </div>
                      </div>
                      <div className="flex items-baseline mt-6 mb-2">
                        <span className="font-headline text-2xl font-medium text-on-surface-variant mr-1.5">₦</span>
                        <p className="font-headline text-5xl font-black text-on-surface tracking-tight">
                          {Number(profile?.walletBalance || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </p>
                      </div>
                      <button
                        onClick={() => setIsDepositModalOpen(true)}
                        className="mt-6 w-full sm:w-auto self-start px-6 h-12 rounded-xl bg-primary text-on-primary font-headline text-xs font-bold uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow-lg shadow-primary/20"
                      >
                        <span className="material-symbols-outlined text-base">add</span>
                        Add Funds
                      </button>
                    </div>
                  </div>

                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-6 sm:p-8 shadow-sm">
                    <p className="font-label text-[9px] text-outline uppercase tracking-widest mb-6">Transaction Ledger</p>
                    {txHistory.length === 0 ? (
                      <div className="py-20 text-center opacity-30">
                        <span className="material-symbols-outlined text-4xl mb-4">receipt_long</span>
                        <p className="font-body text-sm font-medium">No transactions recorded.</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {txHistory.slice(0, 20).map(tx => (
                          <div key={tx.id} className="bg-surface-container p-5 rounded-2xl border border-outline-variant/5 flex items-center justify-between hover:border-outline-variant/20 transition-colors">
                            <div>
                              <p className="font-body text-sm font-semibold text-on-surface">{tx.type}</p>
                              <p className="font-label text-[9px] text-outline uppercase tracking-widest mt-1">{new Date(tx.createdAt).toLocaleDateString()}</p>
                            </div>
                            <div className="text-right">
                              <p className={`font-headline text-base font-black ${tx.payerId === user?.id ? 'text-error' : 'text-tertiary'}`}>
                                {tx.payerId === user?.id ? '-' : '+'}₦{tx.amount?.toLocaleString()}
                              </p>
                              <span className={`font-label text-[8px] uppercase tracking-widest ${tx.status === 'SUCCESS' ? 'text-tertiary' : 'text-error'}`}>{tx.status}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.section>
              )}

              {/* Privacy Tab */}
              {activeTab === 'privacy' && (
                <motion.section
                  key="privacy"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  transition={{ duration: 0.2 }}
                  className="space-y-6"
                >
                  {/* What we store */}
                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-6 sm:p-8 space-y-6 shadow-sm">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary">lock</span>
                      <h3 className="font-headline text-base font-bold text-on-surface">Data Retention Policy</h3>
                    </div>
                    <ul className="space-y-4">
                      {[
                        `Ghost ID: ${profile?.publicId || '—'}`,
                        'Your nickname and avatar (optional, editable in Identity tab)',
                        'A one-way hash of your phone number — not the true number itself',
                        'Consultation history strictly linked to your Ghost ID, completely decoupled from personal context',
                      ].map((item, i) => (
                        <li key={i} className="flex items-start gap-4 text-sm text-on-surface-variant leading-relaxed">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-2 shrink-0" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Export */}
                  <div className="bg-surface-container-low border border-outline-variant/10 rounded-[32px] p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 shadow-sm">
                    <div>
                      <h3 className="font-headline text-base font-bold text-on-surface">Export Protocol</h3>
                      <p className="font-body text-sm text-on-surface-variant mt-1 opacity-70">Download an encrypted local copy of your profile data as a JSON manifest.</p>
                    </div>
                    <button onClick={handleDownloadData} className="shrink-0 flex items-center gap-2 h-12 px-6 rounded-xl bg-surface-container-highest border border-outline-variant/10 font-label text-[10px] uppercase tracking-widest text-on-surface hover:bg-surface-container hover:scale-[1.02] active:scale-[0.98] transition-all">
                      <span className="material-symbols-outlined text-base">download</span>
                      Export Manifest
                    </button>
                  </div>

                  {/* Danger Zone */}
                  <div className="bg-error/5 border border-error/20 rounded-[32px] p-6 sm:p-8 space-y-5 shadow-sm relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1.5 h-full bg-error" />
                    <div>
                      <p className="font-label text-[9px] text-error uppercase tracking-[0.2em] mb-1">Danger Zone</p>
                      <h3 className="font-headline text-base font-bold text-on-surface">Identity Reset</h3>
                    </div>
                    <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-80 max-w-xl">
                      Permanently erase all your profile data from the secure enclave. This action is absolutely irreversible. Your Ghost ID will be retired forever.
                    </p>
                    <button
                      onClick={handleErase}
                      disabled={erasing}
                      className="h-12 px-8 rounded-xl bg-error/10 border border-error/20 text-error font-label text-[10px] uppercase tracking-widest hover:bg-error hover:text-white transition-all shadow-sm disabled:opacity-50"
                    >
                      {erasing ? 'Erasing Identity...' : 'Request Complete Erase'}
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Deposit Modal */}
        <DepositModal
          isOpen={isDepositModalOpen}
          onClose={() => setIsDepositModalOpen(false)}
          onDepositSuccess={() => loadProfileAndHistory(false)}
        />
      </div>
    </div>
  );
}

function DepositModal({ isOpen, onClose, onDepositSuccess }) {
  const [amount, setAmount] = useState('');
  const [voucherCode, setVoucherCode] = useState('');
  const [method, setMethod] = useState('moniepoint'); // 'moniepoint', 'card', 'bank', or 'voucher'
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState('input'); // 'input', 'verifying', 'success'
  const toast = useToast();

  const [mpSubMethod, setMpSubMethod] = useState('transfer'); // 'transfer', 'ussd', 'card_popup'
  const [mpAccountNum, setMpAccountNum] = useState('');
  const [mpTimeLeft, setMpTimeLeft] = useState(600);
  const [isMpPopupOpen, setIsMpPopupOpen] = useState(false);
  const [mpOtpCode, setMpOtpCode] = useState('');
  const [mpPopupStep, setMpPopupStep] = useState('card_input'); // 'card_input', 'otp_input', 'success'

  useEffect(() => {
    if (isOpen) {
      setMpAccountNum('8039' + Math.floor(100000 + Math.random() * 900000));
      setMpTimeLeft(600);
      setIsMpPopupOpen(false);
      setMpPopupStep('card_input');
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && mpTimeLeft > 0) {
      const t = setInterval(() => {
        setMpTimeLeft(prev => prev - 1);
      }, 1000);
      return () => clearInterval(t);
    }
  }, [isOpen, mpTimeLeft]);

  const formatTime = (sec) => {
    const mins = Math.floor(sec / 60);
    const secs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handlePay = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStep('verifying');
    try {
      if (method === 'voucher') {
        if (!voucherCode.trim()) {
          toast.error('Please enter a voucher code.');
          setStep('input');
          setLoading(false);
          return;
        }
        const res = await api.post('/payments/voucher', { code: voucherCode.trim() });
        toast.success(res.data.msg);
      } else {
        const numAmt = Number(amount);
        if (!numAmt || numAmt <= 0) {
          toast.error('Please enter a valid positive amount.');
          setStep('input');
          setLoading(false);
          return;
        }
        await api.post('/payments/deposit', { amount: numAmt });
      }
      setStep('success');
      setTimeout(() => {
        onDepositSuccess();
        onClose();
        setAmount('');
        setVoucherCode('');
        setStep('input');
        setLoading(false);
      }, 1500);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Deposit failed.');
      setStep('input');
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => { if (!loading) onClose(); }}
        />
        {/* Modal Window */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden w-full max-w-md shadow-2xl relative z-10"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-outline-variant/5 bg-surface-container-low/50">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">payments</span>
              <h3 className="font-headline text-base font-bold text-on-surface">Payment Terminal</h3>
            </div>
            {!loading && (
              <button onClick={onClose} className="material-symbols-outlined text-outline hover:text-on-surface transition-colors p-1 bg-surface-container-high rounded-full">
                close
              </button>
            )}
          </div>

          <div className="p-6">
            {step === 'input' && (
              <form onSubmit={handlePay} className="space-y-5">
                {method !== 'voucher' ? (
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-outline">Amount (NGN)</label>
                    <input
                      type="number"
                      value={amount}
                      onChange={e => setAmount(e.target.value)}
                      placeholder="Enter amount to deposit"
                      min="100"
                      required
                      className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-4 text-center text-2xl font-headline font-bold text-on-surface focus:border-primary/40 focus:outline-none"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="font-label text-[10px] uppercase tracking-widest text-outline">Voucher Code</label>
                    <input
                      type="text"
                      value={voucherCode}
                      onChange={e => setVoucherCode(e.target.value)}
                      placeholder="e.g. EMPOWER2026"
                      required
                      className="w-full bg-surface-container border border-outline-variant/10 rounded-2xl px-5 py-4 text-center text-lg font-mono uppercase font-bold text-primary focus:border-primary/40 focus:outline-none"
                    />
                  </div>
                )}

                {/* Tabs for payment method */}
                <div className="grid grid-cols-4 bg-surface-container rounded-xl p-1 gap-0.5">
                  <button
                    type="button"
                    onClick={() => setMethod('moniepoint')}
                    className={`py-2 rounded-lg font-label text-[8px] uppercase tracking-wider transition-all font-bold ${
                      method === 'moniepoint' ? 'bg-[#008b5e] text-white shadow-sm' : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    Moniepoint
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('card')}
                    className={`py-2 rounded-lg font-label text-[8px] uppercase tracking-wider transition-all font-bold ${
                      method === 'card' ? 'bg-background text-on-surface shadow-sm' : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    Card
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('bank')}
                    className={`py-2 rounded-lg font-label text-[8px] uppercase tracking-wider transition-all font-bold ${
                      method === 'bank' ? 'bg-background text-on-surface shadow-sm' : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    Bank
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod('voucher')}
                    className={`py-2 rounded-lg font-label text-[8px] uppercase tracking-wider transition-all font-bold ${
                      method === 'voucher' ? 'bg-background text-on-surface shadow-sm' : 'text-outline hover:text-on-surface'
                    }`}
                  >
                    Voucher
                  </button>
                </div>

                {method === 'moniepoint' && (
                  <div className="space-y-4 p-4 rounded-2xl bg-surface-container border border-outline-variant/10">
                    <div className="flex items-center gap-2 border-b border-outline-variant/5 pb-3 mb-2">
                      <div className="w-6 h-6 rounded-lg bg-[#008b5e] flex items-center justify-center font-bold text-white text-[10px]">M</div>
                      <p className="font-headline text-xs font-bold text-on-surface">Moniepoint Secure Checkout</p>
                    </div>

                    {/* Moniepoint inner tabs */}
                    <div className="flex bg-background rounded-lg p-1 gap-1">
                      {[
                        { id: 'transfer', label: 'Transfer' },
                        { id: 'card_popup', label: 'Card' },
                        { id: 'ussd', label: 'USSD Code' }
                      ].map(sub => (
                        <button
                          key={sub.id}
                          type="button"
                          onClick={() => setMpSubMethod(sub.id)}
                          className={`flex-1 py-1.5 rounded font-label text-[8px] uppercase tracking-wider transition-all font-bold ${
                            mpSubMethod === sub.id
                              ? 'bg-[#008b5e] text-white shadow-sm'
                              : 'text-outline hover:text-[#008b5e]'
                          }`}
                        >
                          {sub.label}
                        </button>
                      ))}
                    </div>

                    {mpSubMethod === 'transfer' && (
                      <div className="space-y-3 font-mono text-[10px] text-on-surface">
                        <div className="flex justify-between items-center bg-background p-3 rounded-xl border border-outline-variant/5">
                          <span className="text-outline">Bank:</span>
                          <span className="font-bold text-right">Moniepoint MFB</span>
                        </div>
                        <div className="flex justify-between items-center bg-background p-3 rounded-xl border border-outline-variant/5">
                          <span className="text-outline">Account:</span>
                          <span className="font-bold text-right tracking-widest flex items-center gap-1.5">
                            {mpAccountNum}
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(mpAccountNum);
                                toast.success('Account number copied.');
                              }}
                              className="material-symbols-outlined text-[12px] text-[#ffcb05] hover:scale-105 active:scale-95"
                            >
                              content_copy
                            </button>
                          </span>
                        </div>
                        <div className="flex justify-between items-center bg-background p-3 rounded-xl border border-outline-variant/5">
                          <span className="text-outline">Timer:</span>
                          <span className="font-bold text-right text-amber-400">{formatTime(mpTimeLeft)}</span>
                        </div>
                      </div>
                    )}

                    {mpSubMethod === 'ussd' && (
                      <div className="p-3 bg-background border border-outline-variant/5 rounded-xl text-center space-y-2">
                        <p className="font-body text-[10px] text-outline">Dial the shortcode below on your registered phone number:</p>
                        <p className="font-mono text-base font-black text-[#ffcb05] tracking-wide mt-1.5">
                          *5573*1*{amount || '5000'}#
                        </p>
                        <button
                          type="button"
                          onClick={() => toast.success('USSD string copied.')}
                          className="font-mono text-[8px] text-[#008b5e] uppercase tracking-widest font-bold hover:underline"
                        >
                          Copy USSD Code
                        </button>
                      </div>
                    )}

                    {mpSubMethod === 'card_popup' && (
                      <div className="text-center p-4 bg-background border border-outline-variant/5 rounded-xl space-y-3">
                        <span className="material-symbols-outlined text-3xl text-[#008b5e]">credit_card</span>
                        <p className="font-body text-[10px] text-outline leading-relaxed">
                          Securely input credentials using Moniepoint's dynamic web portal gateway.
                        </p>
                        <button
                          type="button"
                          onClick={() => {
                            if (!amount || Number(amount) <= 0) {
                              toast.error('Please enter a valid amount first.');
                              return;
                            }
                            setIsMpPopupOpen(true);
                            setMpPopupStep('card_input');
                          }}
                          className="w-full bg-[#008b5e] hover:bg-[#00744f] text-white text-[10px] uppercase tracking-wider font-bold py-2.5 rounded-lg active:scale-95 transition-all shadow"
                        >
                          Launch Moniepoint Portal
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {method === 'card' && (
                  <div className="space-y-3 p-4 rounded-2xl bg-surface-container border border-outline-variant/5">
                    <div className="space-y-1">
                      <label className="font-label text-[9px] uppercase tracking-wider text-outline">Card Number</label>
                      <input
                        type="text"
                        placeholder="4000 1234 5678 9010"
                        className="w-full bg-background border border-outline-variant/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <label className="font-label text-[9px] uppercase tracking-wider text-outline">Expiry</label>
                        <input
                          type="text"
                          placeholder="12/29"
                          className="w-full bg-background border border-outline-variant/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="font-label text-[9px] uppercase tracking-wider text-outline">CVV</label>
                        <input
                          type="password"
                          maxLength={3}
                          placeholder="•••"
                          className="w-full bg-background border border-outline-variant/10 focus:border-primary/50 rounded-xl px-4 py-3 text-sm font-mono focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {method === 'bank' && (
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/5 space-y-3">
                    <p className="font-body text-xs text-on-surface-variant">
                      Transfer the exact amount to the temporary escrow account below:
                    </p>
                    <div className="p-3 bg-background rounded-xl space-y-1.5 border border-outline-variant/10 font-mono text-sm">
                      <div className="flex justify-between">
                        <span className="text-outline text-xs">Bank:</span>
                        <span className="text-on-surface font-bold">Providus Bank</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline text-xs">Account:</span>
                        <span className="text-on-surface font-bold">1029384756</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-outline text-xs">Name:</span>
                        <span className="text-on-surface font-bold">IncogniCare Escrow</span>
                      </div>
                    </div>
                  </div>
                )}

                {method === 'voucher' && (
                  <div className="p-4 rounded-2xl bg-surface-container border border-outline-variant/5 space-y-2">
                    <p className="font-headline text-xs font-bold text-on-surface">Redeem Sponsored Voucher</p>
                    <p className="font-body text-xs text-on-surface-variant leading-relaxed">
                      Enter a valid 12-digit code or NGO partner voucher (e.g. <span className="font-mono text-primary font-bold">EMPOWER2026</span>) to add prepaid care funds instantly.
                    </p>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full h-14 rounded-2xl bg-primary text-on-primary font-headline font-bold text-[12px] uppercase tracking-widest hover:brightness-110 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-base">lock</span>
                  {method === 'voucher' ? 'Redeem Voucher' : method === 'moniepoint' ? 'Confirm I\'ve Sent Transfer' : `Pay ₦${amount ? Number(amount).toLocaleString() : '0'}`}
                </button>

                <p className="font-label text-[8px] text-outline text-center uppercase tracking-wider opacity-60">
                  🔒 Secured Mock Gateway
                </p>
              </form>
            )}

            {step === 'verifying' && (
              <div className="py-12 flex flex-col items-center justify-center gap-4">
                <div className="w-12 h-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                <p className="font-headline text-sm font-bold text-on-surface">Verifying transaction...</p>
                <p className="font-body text-xs text-outline">Simulating bank clearance</p>
              </div>
            )}

            {step === 'success' && (
              <div className="py-12 flex flex-col items-center justify-center gap-4">
                <div className="w-16 h-16 rounded-full bg-tertiary/20 flex items-center justify-center text-tertiary animate-bounce">
                  <span className="material-symbols-outlined text-3xl font-bold">check</span>
                </div>
                <p className="font-headline text-base font-bold text-on-surface">Deposit Successful!</p>
                <p className="font-body text-xs text-outline">₦{Number(amount).toLocaleString()} added to wallet</p>
              </div>
            )}
          </div>

          {/* Moniepoint Checkout Popup Overlay */}
          <AnimatePresence>
            {isMpPopupOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-20 bg-black/80 flex items-center justify-center p-6"
              >
                <div className="bg-[#0c0c0c] border border-white/10 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl flex flex-col justify-between" style={{ minHeight: '320px' }}>
                  <div className="bg-[#008b5e] p-4 text-white flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-sm text-[#ffcb05]">shield</span>
                      <span className="font-mono text-[9px] uppercase tracking-widest font-black">Moniepoint Checkout</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsMpPopupOpen(false)}
                      className="material-symbols-outlined text-sm text-white/80 hover:text-white"
                    >
                      close
                    </button>
                  </div>

                  <div className="p-6 flex-1 flex flex-col justify-center">
                    {mpPopupStep === 'card_input' && (
                      <div className="space-y-4 text-left">
                        <div className="text-center mb-2">
                          <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest">Amount to Pay</p>
                          <p className="font-sans text-xl font-black text-white mt-1">₦{Number(amount).toLocaleString()}</p>
                        </div>
                        <div className="space-y-1">
                          <label className="font-mono text-[7px] text-white/40 uppercase tracking-wider">Card Number</label>
                          <input
                            type="text"
                            placeholder="5061 2938 4810 2938"
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#008b5e]"
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div className="space-y-1">
                            <label className="font-mono text-[7px] text-white/40 uppercase tracking-wider">Expiry</label>
                            <input
                              type="text"
                              placeholder="08/29"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                          <div className="space-y-1">
                            <label className="font-mono text-[7px] text-white/40 uppercase tracking-wider">CVV</label>
                            <input
                              type="password"
                              maxLength={3}
                              placeholder="•••"
                              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-xs text-white focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => setMpPopupStep('otp_input')}
                          className="w-full h-11 bg-[#008b5e] hover:bg-[#00744f] text-white font-sans text-xs font-bold rounded-xl active:scale-[0.98] transition-all mt-4"
                        >
                          Pay ₦{Number(amount).toLocaleString()}
                        </button>
                      </div>
                    )}

                    {mpPopupStep === 'otp_input' && (
                      <div className="space-y-4 text-left">
                        <div className="text-center mb-2">
                          <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest">Enter 6-Digit OTP</p>
                          <p className="font-mono text-[8px] text-[#ffcb05] uppercase tracking-wider mt-1">Simulated Code: 123456</p>
                        </div>
                        <input
                          type="text"
                          value={mpOtpCode}
                          onChange={(e) => setMpOtpCode(e.target.value)}
                          placeholder="••••••"
                          maxLength={6}
                          className="w-full bg-white/5 border border-white/10 rounded-xl py-3 text-center text-lg font-mono tracking-widest text-white focus:outline-none focus:border-[#008b5e]"
                        />
                        <button
                          type="button"
                          onClick={async () => {
                            if (mpOtpCode === '123456') {
                              setMpPopupStep('success');
                              try {
                                await api.post('/payments/deposit', { amount: Number(amount) });
                                setTimeout(() => {
                                  setIsMpPopupOpen(false);
                                  onDepositSuccess();
                                  onClose();
                                  setAmount('');
                                  setStep('input');
                                }, 1500);
                              } catch {
                                toast.error('Simulation ledger write failed.');
                                setMpPopupStep('card_input');
                              }
                            } else {
                              toast.error('Invalid OTP. Try 123456');
                            }
                          }}
                          className="w-full h-11 bg-[#008b5e] hover:bg-[#00744f] text-white font-sans text-xs font-bold rounded-xl active:scale-[0.98] transition-all"
                        >
                          Authorize Transaction
                        </button>
                      </div>
                    )}

                    {mpPopupStep === 'success' && (
                      <div className="py-6 flex flex-col items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-full bg-[#008b5e]/20 flex items-center justify-center text-[#008b5e] animate-bounce">
                          <span className="material-symbols-outlined text-2xl font-bold">check</span>
                        </div>
                        <p className="font-sans text-sm font-bold text-white">Payment Authorized!</p>
                        <p className="font-sans text-[10px] text-white/50">Processing escrow credit...</p>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

        </motion.div>
      </div>
    </AnimatePresence>
  );
}
