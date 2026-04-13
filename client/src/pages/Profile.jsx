import { useState, useEffect, useMemo } from 'react';
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
  const { user, login, token } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nickname: '', avatar: '', age: '', sex: '' });
  const [txHistory, setTxHistory] = useState([]);
  const [activeTab, setActiveTab] = useState('identity');

  const avatarSeeds = useMemo(() => generateAvatarSeeds(user?.publicId), [user?.publicId]);

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await api.get('/user/profile');
        setProfile(res.data);
        setForm({
          nickname: res.data.nickname || '',
          avatar: res.data.avatar || '',
          age: res.data.age || '',
          sex: res.data.sex || '',
        });
      } catch {
        toast.error('Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };
    const fetchHistory = async () => {
      try {
        const res = await api.get('/payments/history');
        setTxHistory(res.data || []);
      } catch {}
    };
    fetchProfile();
    fetchHistory();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      const res = await api.put('/user/profile', payload);
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
    a.download = `incognihealth-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported.');
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
                    <div className="space-y-3">
                      <label className="font-label text-[9px] text-outline uppercase tracking-widest pl-1">Avatar Variant</label>
                      <div className="grid grid-cols-4 sm:grid-cols-6 lg:grid-cols-8 gap-3">
                        {avatarSeeds.map(seed => (
                          <button
                            key={seed}
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

                    <div className="pt-2">
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="w-full lg:w-auto px-8 btn-primary h-14 text-[11px]"
                      >
                        {saving ? 'Saving Changes...' : 'Save Identity Preferences'}
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
                  className="space-y-4"
                >
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
                    <button className="h-12 px-8 rounded-xl bg-error/10 border border-error/20 text-error font-label text-[10px] uppercase tracking-widest hover:bg-error hover:text-white transition-all shadow-sm">
                      Request Complete Erase
                    </button>
                  </div>
                </motion.section>
              )}
            </AnimatePresence>
          </div>
        </div>

      </div>
    </div>
  );
}
