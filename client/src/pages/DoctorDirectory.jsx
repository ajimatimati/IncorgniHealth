import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '../components/Toast';
import { motion, AnimatePresence } from 'framer-motion';
import AvatarGenerator from '../components/AvatarGenerator';
import RippleButton from '../components/RippleButton';
import EmptyState from '../components/EmptyState';
import api from '../api';
import { Star, Clock, Zap, Search, Users, Activity } from 'lucide-react';

const DoctorDirectory = () => {
  const [doctors, setDoctors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch]   = useState('');
  const [starting, setStarting] = useState(null);

  const navigate = useNavigate();
  const toast    = useToast();

  useEffect(() => { fetchDoctors(); }, []);

  const fetchDoctors = async () => {
    try {
      const res = await api.get('/user/doctors');
      setDoctors(res.data.data || []);
    } catch {
      toast.error('Failed to load the specialist directory.');
    } finally {
      setLoading(false);
    }
  };

  const startConsultation = async (doctorId) => {
    setStarting(doctorId);
    try {
      const res = await api.post('/consultation/start', { doctorId });
      toast.success('Connecting you now…');
      navigate(`/waiting-room/${res.data.id}`);
    } catch {
      toast.error('Could not initiate consultation. Please try again.');
    } finally {
      setStarting(null);
    }
  };

  const scheduleConsultation = () => {
    toast.info('Scheduled consultations are coming soon.');
  };

  const filtered = doctors.filter(d =>
    (d.nickname?.toLowerCase().includes(search.toLowerCase()) ||
     d.specialization?.toLowerCase().includes(search.toLowerCase()))
  );

  const onlineCount = doctors.filter(d => d.isOnline).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh bg-[#F8F7F6] pb-28 lg:pb-12 px-4 pt-6 lg:px-8 lg:pt-10 max-w-5xl mx-auto"
    >
      {/* ── Header ── */}
      <div className="mb-8">
        <p className="section-label mb-1">Incognihealth Network</p>
        <h1 className="text-3xl font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          Specialist Directory
        </h1>
        <p className="text-sm text-[#71717A] mt-1">Choose a verified specialist for a confidential, secure consultation.</p>
      </div>

      {/* ── Stats strip ── */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-white rounded-2xl p-4 shadow-card border border-[#F0EDED] flex flex-col">
          <p className="text-2xl font-black text-[#18181B] tabular-nums">{doctors.length}</p>
          <p className="section-label mt-1 flex items-center gap-1.5"><Users className="w-3 h-3" /> Specialists</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-[#F0EDED] flex flex-col">
          <p className="text-2xl font-black text-[#059669] tabular-nums">{onlineCount}</p>
          <p className="section-label mt-1 flex items-center gap-1.5"><Activity className="w-3 h-3" /> Available Now</p>
        </div>
        <div className="bg-white rounded-2xl p-4 shadow-card border border-[#F0EDED] flex flex-col">
          <p className="text-2xl font-black text-[#6D28D9] tabular-nums">100%</p>
          <p className="section-label mt-1">Encrypted</p>
        </div>
      </div>

      {/* ── Search ── */}
      <div className="bg-white rounded-2xl border border-[#E8E6E3] shadow-card mb-6 flex items-center gap-3 px-4 py-3">
        <Search className="w-4 h-4 text-[#A1A1AA] shrink-0" strokeWidth={2} />
        <input
          type="text"
          placeholder="Search by name or specialty…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 text-sm bg-transparent text-[#18181B] placeholder-[#A1A1AA] focus:outline-none"
        />
      </div>

      {/* ── Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="animate-pulse bg-white h-72 rounded-2xl border border-[#F0EDED] shadow-card" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E6E3] shadow-card py-16">
          <EmptyState icon={<Users className="w-8 h-8 text-[#A1A1AA]" strokeWidth={1.5} />} message="No specialists match your search." />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <AnimatePresence>
            {filtered.map((doc, idx) => (
              <motion.article
                key={doc.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                transition={{ delay: idx * 0.04, duration: 0.3 }}
                className="bg-white rounded-2xl border border-[#E8E6E3] shadow-card hover:shadow-card-md transition-shadow flex flex-col overflow-hidden"
              >
                {/* Card top */}
                <div className="p-5 flex flex-col items-center text-center border-b border-[#F0EDED]">
                  <div className="relative mb-4">
                    <AvatarGenerator seed={doc.avatar || doc.publicId} size="xl" />
                    {doc.isOnline && (
                      <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-[#059669] border-2 border-white shadow-sm" />
                    )}
                  </div>
                  <h2 className="text-[15px] font-bold text-[#18181B] truncate w-full" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                    {doc.nickname || `Dr. ${doc.publicId?.slice(0, 6)}`}
                  </h2>
                  <span className="mt-1.5 inline-block text-[11px] font-bold text-[#6D28D9] bg-[#EDE9FE] px-3 py-1 rounded-full">
                    {doc.specialization || 'General Practitioner'}
                  </span>
                  {doc.isOnline ? (
                    <span className="mt-2 text-[11px] font-bold text-[#059669] flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#059669] animate-pulse" /> Available now
                    </span>
                  ) : (
                    <span className="mt-2 text-[11px] text-[#A1A1AA]">Offline</span>
                  )}
                </div>

                {/* Stats row */}
                <div className="grid grid-cols-2 divide-x divide-[#F0EDED] bg-[#F9F9FB]">
                  <div className="py-3 flex flex-col items-center">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 text-[#D97706] fill-[#D97706]" />
                      <span className="text-[14px] font-black text-[#18181B]">
                        {doc.rating > 0 ? doc.rating.toFixed(1) : '—'}
                      </span>
                    </div>
                    <span className="section-label mt-0.5">{doc.reviewCount} Reviews</span>
                  </div>
                  <div className="py-3 flex flex-col items-center justify-center">
                    <span className="text-[14px] font-black text-[#18181B]">₦15,000</span>
                    <span className="section-label mt-0.5">Per Session</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="p-4 grid grid-cols-2 gap-2">
                  <button
                    onClick={scheduleConsultation}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-[#F4F4F5] hover:bg-[#E4E4E7] text-[#18181B] rounded-xl text-[12px] font-bold uppercase tracking-wider transition-colors border border-[#E8E6E3]"
                  >
                    <Clock className="w-3.5 h-3.5" /> Schedule
                  </button>
                  <button
                    onClick={() => startConsultation(doc.id)}
                    disabled={starting === doc.id}
                    className="flex items-center justify-center gap-1.5 py-2.5 bg-[#6D28D9] hover:bg-[#5B21B6] text-white rounded-xl text-[12px] font-bold uppercase tracking-wider transition-colors shadow-sm disabled:opacity-50"
                  >
                    <Zap className="w-3.5 h-3.5" />
                    {starting === doc.id ? 'Connecting…' : 'Consult'}
                  </button>
                </div>
              </motion.article>
            ))}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
};

export default DoctorDirectory;
