import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import AvatarGenerator from '../components/AvatarGenerator';
import api from '../api';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import { Lock, Download } from 'lucide-react';

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
      const payload = Object.fromEntries(
        Object.entries(form).filter(([, v]) => v !== '' && v !== null && v !== undefined)
      );
      const res = await api.put('/user/profile', payload);
      toast.success('Profile updated.');
      const updatedUser = { ...user, ...(res.data.user ?? res.data) };
      login(token, updatedUser);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not save changes. Check server connection.');
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
        <div className="w-8 h-8 border-2 border-[#E8E6E3] border-t-[#6D28D9] rounded-full animate-spin" />
      </div>
    );
  }

  const roleLabels = { PATIENT: 'Client', DOCTOR: 'Doctor', PHARMACIST: 'Pharmacist', RIDER: 'Rider', ADMIN: 'Admin', SARC_OFFICER: 'SARC Officer' };

  const fields = ['nickname', 'avatar', 'age', 'sex'];
  const filled = fields.filter(f => form[f] && String(form[f]).trim()).length;
  const completeness = Math.round((filled / fields.length) * 100);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}
      className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto font-sans"
    >
      <h1 className="text-3xl font-black text-[#18181B] mb-8" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Your Profile</h1>

      {/* Ghost ID card */}
      <div className="bg-white p-6 mb-8 rounded-2xl border border-[#E8E6E3] shadow-card-sm">
        <div className="flex items-center gap-5">
          <AvatarGenerator seed={form.avatar || user?.publicId} size="lg" />
          <div>
            <p className="font-mono text-lg font-bold text-[#18181B] uppercase">{profile?.publicId}</p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="text-[11px] font-bold text-[#6D28D9] bg-[#F5F3FF] px-2.5 py-1 rounded-full uppercase tracking-wider">
                {roleLabels[profile?.role] || profile?.role}
              </span>
            </div>
          </div>
        </div>

        {/* Completeness */}
        <div className="mt-8 border-t border-[#F0EDED] pt-5">
          <div className="flex items-center justify-between mb-3">
            <span className="section-label !mb-0">Profile Completeness</span>
            <span className="text-sm font-black text-[#18181B]">{completeness}%</span>
          </div>
          <div className="w-full bg-[#F4F4F5] h-2 rounded-full overflow-hidden">
            <div className="bg-[#6D28D9] h-full transition-all duration-500 rounded-full" style={{ width: `${completeness}%` }} />
          </div>
        </div>
      </div>

      {/* Edit form */}
      <div className="bg-white p-6 md:p-8 mb-8 rounded-2xl border border-[#E8E6E3] shadow-card-sm">
        <h2 className="text-xl font-black text-[#18181B] mb-6 border-b border-[#F0EDED] pb-4">Ghost Identity</h2>
        <div className="space-y-6">
          <div>
            <label className="section-label mb-2 block">Nickname</label>
            <input
              type="text"
              value={form.nickname}
              onChange={(e) => setForm(f => ({ ...f, nickname: e.target.value }))}
              placeholder="What should we call you?"
              className="w-full bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#6D28D9] focus:bg-white transition-colors"
            />
          </div>

          <div>
            <label className="section-label mb-2 block">Avatar Variant</label>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-3">
              {avatarSeeds.map((seed) => (
                <button
                  key={seed}
                  onClick={() => setForm(f => ({ ...f, avatar: seed }))}
                  className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all p-1 border ${
                    form.avatar === seed
                      ? 'border-[#6D28D9] shadow-[0_0_0_2px_rgba(109,40,217,0.2)] bg-[#F5F3FF]'
                      : 'border-[#E8E6E3] bg-white hover:border-[#D4D4D8] hover:shadow-sm'
                  }`}
                >
                  <AvatarGenerator seed={seed} size="md" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
            <div>
              <label className="section-label mb-2 block">Age</label>
              <input
                type="number"
                value={form.age}
                onChange={(e) => setForm(f => ({ ...f, age: e.target.value }))}
                placeholder="Age"
                className="w-full bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#6D28D9] focus:bg-white transition-colors"
                min="13" max="120"
              />
            </div>
            <div>
              <label className="section-label mb-2 block">Sex</label>
              <select
                value={form.sex}
                onChange={(e) => setForm(f => ({ ...f, sex: e.target.value }))}
                className="w-full bg-[#F9F9FB] border border-[#E8E6E3] rounded-xl px-4 py-3 text-[14px] focus:outline-none focus:border-[#6D28D9] focus:bg-white transition-colors appearance-none"
              >
                <option value="">Prefer not to say</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <div className="pt-4 mt-2 border-t border-[#F0EDED]">
            <RippleButton onClick={handleSave} disabled={saving} className="w-full justify-center">
              {saving ? 'Saving...' : 'Save Changes'}
            </RippleButton>
          </div>
        </div>
      </div>

      {/* What we know */}
      <div className="bg-[#F9F9FB] p-6 mb-8 rounded-2xl border border-[#E8E6E3]">
        <div className="flex items-center gap-3 mb-4">
          <Lock className="w-5 h-5 text-[#6D28D9]" strokeWidth={2} />
          <h3 className="text-[14px] font-black text-[#18181B]">What we store about you</h3>
        </div>
        <ul className="text-[13px] text-[#71717A] space-y-2.5">
          <li className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 bg-[#A1A1AA] rounded-full" /> Ghost ID: <span className="font-mono font-bold text-[#18181B]">{profile?.publicId}</span>
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 bg-[#A1A1AA] rounded-full" /> Nickname, avatar, age, sex (optional, editable above)
          </li>
          <li className="flex items-center gap-2.5">
            <span className="w-1.5 h-1.5 bg-[#A1A1AA] rounded-full" /> A one-way hash of your phone number (not the number itself)
          </li>
        </ul>
      </div>

      {/* Download Data */}
      <div className="bg-white p-6 mb-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 rounded-2xl border border-[#E8E6E3] shadow-card-sm">
        <div>
          <h3 className="font-bold text-[#18181B] text-[15px]">Export Your Data</h3>
          <p className="text-[12px] text-[#71717A] mt-1 line-clamp-2 pr-4">Download a JSON file containing all your local and remote profile data.</p>
        </div>
        <RippleButton onClick={handleDownloadData} variant="secondary" className="shrink-0 flex items-center justify-center gap-2">
          <Download className="w-4 h-4" strokeWidth={2} />
          Export
        </RippleButton>
      </div>

      {/* Transaction history */}
      {txHistory.length > 0 && (
        <div className="mb-12">
          <h2 className="text-xl font-black text-[#18181B] mb-5">Transaction History</h2>
          <div className="space-y-3">
            {txHistory.slice(0, 10).map((tx) => (
              <div key={tx.id} className="bg-white p-4 rounded-xl flex items-center justify-between border border-[#E8E6E3] shadow-sm">
                <div>
                  <p className="text-[14px] font-bold text-[#18181B]">{tx.type}</p>
                  <p className="text-[11px] font-semibold text-[#A1A1AA] mt-1 uppercase tracking-wider">{new Date(tx.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <p className={`text-[15px] font-black ${tx.status === 'SUCCESS' ? 'text-[#059669]' : 'text-[#DC2626]'}`}>
                    {tx.payerId === user?.id ? '-' : '+'}{'\u20A6'}{tx.amount?.toLocaleString()}
                  </p>
                  <p className="text-[10px] uppercase font-bold text-[#A1A1AA] tracking-widest mt-0.5">{tx.status}</p>
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
