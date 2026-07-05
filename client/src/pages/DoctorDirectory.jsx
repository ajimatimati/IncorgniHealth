import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import api from '../api';
import AvatarGenerator from '../components/AvatarGenerator';

const SPECIALIZATIONS = [
  'All', 'General Practice', 'Mental Health', 'Sexual Health',
  'Internal Medicine', 'Paediatrics', 'Obstetrics', 'Surgery', 'Emergency',
];

function StarRating({ rating }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          className={`material-symbols-outlined text-[13px] ${i <= Math.round(rating || 0) ? 'text-primary' : 'text-outline opacity-20'}`}
          style={{ fontVariationSettings: i <= Math.round(rating || 0) ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
      <span className="font-mono text-[9px] text-outline ml-1.5">{(rating || 5.0).toFixed(1)}</span>
    </div>
  );
}

function DoctorCard({ doctor, onConsult }) {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-white/[0.03] to-white/[0.01] border border-white/5 rounded-3xl p-6 flex flex-col gap-5 hover:border-primary/20 hover:from-white/[0.05] hover:to-primary/[0.01] transition-all duration-300 group">
      
      {/* Glow highlight background */}
      <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-all duration-500 pointer-events-none" />

      <div className="flex items-start gap-4">
        {/* Avatar Frame with animated zoom and LED pulse */}
        <div className="relative shrink-0">
          <div className="w-16 h-16 rounded-2xl overflow-hidden border border-white/5 bg-surface-container-low group-hover:scale-105 transition-all duration-300">
            <AvatarGenerator seed={doctor.avatar || doctor.publicId} size="lg" />
          </div>
          {doctor.isOnline ? (
            <span className="absolute -top-1 -right-1 flex h-3 w-3">
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-400 border border-black/80 shadow-sm" />
            </span>
          ) : (
            <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-neutral-600 border border-black/80" />
          )}
        </div>

        {/* Doctor Details */}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <p className="font-headline text-base font-black text-on-surface truncate">
              Dr. {doctor.nickname || doctor.publicId}
            </p>
            {doctor.isOnline && (
              <span className="font-mono text-[8px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/20 uppercase tracking-wider shrink-0 scale-90 origin-left">
                Active
              </span>
            )}
          </div>
          <p className="font-label text-[10px] text-primary uppercase tracking-widest mt-1 truncate">
            {doctor.specialization || 'General Practitioner'}
          </p>
          <div className="mt-2.5">
            <StarRating rating={doctor.rating} />
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-3 py-3 border-y border-white/5">
        <div className="space-y-0.5">
          <span className="font-label text-[8px] text-outline uppercase tracking-wider block">Consult Fee</span>
          <span className="font-mono text-xs text-on-surface font-bold">₦15,000</span>
        </div>
        <div className="space-y-0.5 text-right">
          <span className="font-label text-[8px] text-outline uppercase tracking-wider block">Wait Time</span>
          <span className="font-mono text-xs text-on-surface font-bold">~ 5 mins</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span className="material-symbols-outlined text-[12px] text-outline">verified_user</span>
          <span className="font-mono text-[9px] uppercase tracking-wide text-outline">Verified Enclave</span>
        </div>
        {doctor.reviewCount > 0 && (
          <span className="font-label text-[9px] text-outline">{doctor.reviewCount} patient reviews</span>
        )}
      </div>

      <button
        onClick={() => onConsult(doctor)}
        disabled={!doctor.isOnline}
        className={`w-full py-3.5 rounded-2xl font-label text-[10px] uppercase tracking-widest transition-all duration-300 font-bold
          ${doctor.isOnline
            ? 'bg-primary text-on-primary shadow-lg shadow-primary/10 hover:shadow-primary/25 hover:brightness-110 active:scale-[0.98]'
            : 'bg-white/5 text-outline cursor-not-allowed opacity-50'
          }`}
      >
        {doctor.isOnline ? 'Initiate Private Call' : 'Offline'}
      </button>
    </div>
  );
}

export default function DoctorDirectory() {
  const navigate = useNavigate();

  const [doctors, setDoctors]       = useState([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [filter, setFilter]         = useState('All');

  const fetchDoctors = useCallback(async () => {
    try {
      const res = await api.get('/user/doctors');
      setDoctors(res.data?.data || []);
    } catch (err) {
      console.error('Doctor directory error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDoctors(); }, [fetchDoctors]);

  const handleConsult = async (doctor) => {
    try {
      await api.post('/consultation', { doctorId: doctor.id });
      navigate(`/waiting-room/${doctor.publicId}`);
    } catch (err) {
      navigate(`/waiting-room/${doctor.publicId}`);
    }
  };

  const filtered = doctors.filter(doc => {
    const matchSearch = !search ||
      doc.nickname?.toLowerCase().includes(search.toLowerCase()) ||
      doc.publicId?.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(search.toLowerCase());
    const matchFilter = filter === 'All' || doc.specialization === filter;
    return matchSearch && matchFilter;
  });

  const onlineCount = doctors.filter(d => d.isOnline).length;

  return (
    <div className="bg-background min-h-full text-on-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-12 space-y-8">

        {/* Top Header Section */}
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-white/5 pb-6">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              <p className="font-label text-[10px] text-primary uppercase tracking-[0.25em]">Specialist Network</p>
            </div>
            <h1 className="font-headline text-3xl sm:text-4xl font-black text-on-surface mt-1.5">Consult with verified experts</h1>
            <p className="font-body text-xs text-outline mt-1.5 max-w-xl">
              Connect anonymously with certified Nigerian physicians, clinical experts, and SARC trauma support specialists.
            </p>
          </div>
          
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl px-4 py-2.5 flex items-center gap-3 self-start sm:self-auto">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="font-mono text-[10px] text-emerald-400 uppercase tracking-widest font-bold">{onlineCount} Practitioners active</span>
          </div>
        </header>

        {/* Featured Video Spotlight Card */}
        <div className="relative overflow-hidden rounded-[2.5rem] border border-white/10 bg-black/60 h-48 sm:h-56 flex items-center justify-between p-6 sm:p-8 bento-glass group">
          <video
            src="/physician_standing.mp4"
            autoPlay
            loop
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover opacity-35 group-hover:scale-105 transition-transform duration-700 pointer-events-none"
          />
          <div className="relative z-10 max-w-xl space-y-2">
            <span className="font-mono text-[9px] uppercase tracking-[0.25em] px-3 py-1 rounded-full bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold inline-block">
              Live Clinical Consultation On-Duty
            </span>
            <h2 className="font-sans text-xl sm:text-2xl font-black text-white">
              Connect 1-on-1 with Certified Nigerian Physicians
            </h2>
            <p className="font-sans text-xs text-white/70 leading-relaxed">
              De-identified tele-consultations, digital prescriptions, and instant lab orders without social exposure.
            </p>
          </div>
          <div className="relative z-10 hidden sm:flex items-center gap-3 bg-black/60 backdrop-blur-xl border border-white/10 px-5 py-3 rounded-2xl">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
            <div className="text-left">
              <p className="font-sans text-xs font-bold text-white">Dr. Adebayo, FWACP</p>
              <p className="font-mono text-[9px] text-white/50 uppercase">Clinical Director</p>
            </div>
          </div>
        </div>

        {/* Elevated Search & Filters Controls Bento */}
        <section className="bg-gradient-to-r from-white/[0.03] to-white/[0.01] border border-white/5 rounded-3xl p-4 sm:p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
          
          {/* Glass Search Input */}
          <div className="relative w-full md:w-80 shrink-0">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-lg">search</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or specialty..."
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-2xl pl-11 pr-4 py-3 text-on-surface font-body text-xs outline-none focus:border-primary/40 focus:bg-background transition-all"
            />
          </div>

          {/* Specialties horizontal capsule stream */}
          <div className="w-full overflow-x-auto flex gap-2 scrollbar-hide py-1">
            {SPECIALIZATIONS.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={`px-4 py-2.5 rounded-xl font-label text-[10px] uppercase tracking-wider shrink-0 transition-all font-semibold border ${
                  filter === s
                    ? 'bg-primary border-primary text-on-primary shadow-lg shadow-primary/10'
                    : 'bg-surface-container-low border-outline-variant/10 text-outline hover:text-on-surface hover:border-white/10'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </section>

        {/* Doctor Grid Section */}
        <section className="flex-1">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {[1,2,3,4].map(i => (
                <div key={i} className="h-72 rounded-3xl bg-gradient-to-b from-white/[0.02] to-transparent border border-white/5 flex flex-col justify-between p-6">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 rounded-2xl bg-white/5" />
                    <div className="flex-1 space-y-3 py-1">
                      <div className="h-4 bg-white/5 rounded-full w-2/3" />
                      <div className="h-3 bg-white/5 rounded-full w-1/2" />
                    </div>
                  </div>
                  <div className="h-10 bg-white/5 rounded-2xl" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24 bg-white/[0.01] border border-white/5 rounded-[32px] max-w-xl mx-auto px-6">
              <span className="material-symbols-outlined text-5xl text-outline opacity-20">search_off</span>
              <p className="font-headline text-base font-bold text-on-surface mt-4">No active practitioners found</p>
              <p className="font-body text-xs text-outline mt-1.5">Try widening your search terms or selecting a different specialty category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filtered.map((doc, i) => (
                <motion.div
                  key={doc.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03, duration: 0.3 }}
                >
                  <DoctorCard doctor={doc} onConsult={handleConsult} />
                </motion.div>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
