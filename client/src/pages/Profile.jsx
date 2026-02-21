import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AvatarGenerator from '../components/AvatarGenerator';
import api from '../api';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';

/* Generate 12 seed variations from the user's public ID */
function generateAvatarSeeds(publicId) {
  const base = publicId || 'anon';
  return Array.from({ length: 12 }, (_, i) => `${base}-v${i}`);
}

const Profile = () => {
  const { user, login, token } = useAuth();
  const toast = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ nickname: '', avatar: '', age: '', sex: '' });
  const [txHistory, setTxHistory] = useState([]);

  const avatarSeeds = useMemo(
    () => generateAvatarSeeds(user?.publicId),
    [user?.publicId]
  );

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
      } catch (err) {
        console.error('Profile fetch error:', err);
        toast.error('Could not load your profile.');
      } finally {
        setLoading(false);
      }
    };

    const fetchHistory = async () => {
      try {
        const res = await api.get('/payments/history');
        setTxHistory(res.data);
      } catch {
        // Non-critical
      }
    };

    fetchProfile();
    fetchHistory();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await api.put('/user/profile', form);
      toast.success('Profile updated.');
      const updatedUser = { ...user, ...res.data.user };
      login(token, updatedUser);
    } catch {
      toast.error('Could not save changes.');
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
    a.download = `incorgnihealth-data-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported.');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[60vh]">
        <div className="w-8 h-8 border-2 border-action/30 border-t-action rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabels = {
    PATIENT: 'Patient',
    DOCTOR: 'Doctor',
    PHARMACIST: 'Pharmacist',
    RIDER: 'Rider',
    ADMIN: 'Admin',
    SARC_OFFICER: 'SARC Officer',
  };

  // Profile completeness
  const fields = ['nickname', 'avatar', 'age', 'sex'];
  const filled = fields.filter(f => form[f] && String(form[f]).trim()).length;
  const completeness = Math.round((filled / fields.length) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto relative z-10"
    >
      <h1 className="text-2xl font-bold text-text-primary mb-8">Your Profile</h1>

      {/* Ghost ID card */}
      <div className="glass-card-glow p-6 mb-8">
        <div className="flex items-center gap-4">
          <AvatarGenerator seed={form.avatar || user?.publicId} size="lg" showStatus isOnline />
          <div>
            <p className="font-mono text-lg font-bold text-action">{profile?.publicId}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="badge bg-action/15 text-action border border-action/25">
                {roleLabels[profile?.role] || profile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Completeness */}
        <div className="mt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-text-muted">Profile completeness</span>
            <span className="text-xs font-bold text-action">{completeness}%</span>
          </div>
          <div className="progress-bar">
            <div className="progress-bar-fill" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="card mb-8">
        <h2 className="section-title">Ghost Identity</h2>
        <div className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Nickname</label>
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => setForm(f => ({ ...f, nickname: e.target.value }))}
              placeholder="What should we call you?"
              className="input-field"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-text-secondary mb-2">Avatar</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {avatarSeeds.map((seed) => (
                <button
                  key={seed}
                  onClick={() => setForm(f => ({ ...f, avatar: seed }))}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all p-1 ${
                    form.avatar === seed
                      ? 'ring-2 ring-action ring-offset-2 ring-offset-primary scale-105'
                      : 'bg-surface border border-border-subtle hover:border-border-strong hover:scale-105'
                  }`}
                >
                  <AvatarGenerator seed={seed} size="md" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="Age"
                className="input-field"
                min="13"
                max="120"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-secondary mb-2">Sex</label>
              <select
                value={form.sex}
                onChange={(e) => setForm(f => ({ ...f, sex: e.target.value }))}
                className="input-field"
                style={{ backgroundColor: '#0f1219', color: '#e0e0e0' }}
              >
                <option value="" style={{ backgroundColor: '#0f1219' }}>Prefer not to say</option>
                <option value="Male" style={{ backgroundColor: '#0f1219' }}>Male</option>
                <option value="Female" style={{ backgroundColor: '#0f1219' }}>Female</option>
                <option value="Other" style={{ backgroundColor: '#0f1219' }}>Other</option>
              </select>
            </div>
          </div>

          <RippleButton onClick={handleSave} disabled={saving} className="w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed">
            {saving ? (
              <span className="flex items-center justify-center gap-2">
                <span className="w-4 h-4 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                Saving...
              </span>
            ) : 'Save Changes'}
          </RippleButton>
        </div>
      </div>

      {/* What we know */}
      <div className="glass-card p-5 mb-8">
        <div className="flex items-center gap-3 mb-3">
          <svg className="w-5 h-5 text-action" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h3 className="text-sm font-semibold text-action">What we store about you</h3>
        </div>
        <ul className="text-sm text-text-muted space-y-1.5">
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-action/50 rounded-full" /> Ghost ID: <span className="font-mono text-text-secondary">{profile?.publicId}</span>
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-action/50 rounded-full" /> Nickname, avatar, age, sex (optional, editable above)
          </li>
          <li className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-action/50 rounded-full" /> A one-way hash of your phone number (not the number itself)
          </li>
        </ul>
      </div>

      {/* Download Data */}
      <div className="glass-card p-5 mb-8 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-text-primary">Export Your Data</h3>
          <p className="text-xs text-text-muted mt-1">Download a JSON file of your profile data.</p>
        </div>
        <RippleButton onClick={handleDownloadData} variant="secondary" className="text-sm px-4 py-2 flex items-center justify-center gap-2">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
          </svg>
          Export
        </RippleButton>
      </div>

      {/* Transaction history */}
      {txHistory.length > 0 && (
        <div>
          <h2 className="section-title">Transaction History</h2>
          <div className="space-y-2">
            {txHistory.slice(0, 10).map((tx) => (
              <div key={tx.id} className="card flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-text-primary">{tx.type}</p>
                  <p className="text-xs text-text-dim">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`text-sm font-bold ${tx.status === 'SUCCESS' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {tx.payerId === user?.id ? '-' : '+'}{'\u20A6'}{tx.amount?.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-text-dim">{tx.status}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default Profile;
