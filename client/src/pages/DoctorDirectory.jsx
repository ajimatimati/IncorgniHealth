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
    <div className="flex items-center gap-1">
      {[1,2,3,4,5].map(i => (
        <span
          key={i}
          className={`material-symbols-outlined text-[14px] ${i <= Math.round(rating) ? 'text-primary' : 'text-outline opacity-30'}`}
          style={{ fontVariationSettings: i <= Math.round(rating) ? "'FILL' 1" : "'FILL' 0" }}
        >
          star
        </span>
      ))}
      <span className="font-label text-[10px] text-outline ml-1">{rating?.toFixed(1) || '—'}</span>
    </div>
  );
}

function DoctorCard({ doctor, onConsult }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 flex flex-col gap-4 hover:bg-surface-container-high transition-all group">
      <div className="flex items-start gap-4">
        <div className="relative shrink-0">
          <div className="w-14 h-14 rounded-full overflow-hidden ring-2 ring-primary/10 group-hover:ring-primary/30 transition-all">
            <AvatarGenerator seed={doctor.avatar || doctor.publicId} size="md" />
          </div>
          {doctor.isOnline && (
            <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-tertiary border-2 border-background" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-headline text-sm font-bold text-on-surface truncate">
            Dr. {doctor.nickname || doctor.publicId}
          </p>
          <p className="font-label text-[11px] text-on-surface-variant mt-0.5 truncate">
            {doctor.specialization || 'General Practitioner'}
          </p>
          <div className="mt-2">
            <StarRating rating={doctor.rating} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-on-surface-variant">
        <div className="flex items-center gap-1.5">
          <span className={`w-1.5 h-1.5 rounded-full ${doctor.isOnline ? 'bg-tertiary' : 'bg-outline opacity-40'}`} />
          <span className="font-label text-[10px] uppercase tracking-wide">{doctor.isOnline ? 'Available' : 'Offline'}</span>
        </div>
        {doctor.reviewCount > 0 && (
          <span className="font-label text-[10px] text-outline">{doctor.reviewCount} reviews</span>
        )}
      </div>

      <button
        onClick={() => onConsult(doctor)}
        disabled={!doctor.isOnline}
        className={`w-full py-2.5 rounded-xl font-label text-[11px] uppercase tracking-widest transition-all
          ${doctor.isOnline
            ? 'bg-primary text-on-primary hover:brightness-110 active:scale-[0.98]'
            : 'bg-surface-container-high text-outline cursor-not-allowed opacity-50'
          }`}
      >
        {doctor.isOnline ? 'Consult Now' : 'Not Available'}
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
      const res = await api.post('/consultation', { doctorId: doctor.id });
      navigate(`/waiting-room/${doctor.publicId}`);
    } catch (err) {
      // If consultation already exists, go to waiting room anyway
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        {/* Header */}
        <header className="mb-8">
          <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em]">Doctor Directory</p>
          <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface mt-1">Find a Doctor</h1>
          <div className="flex items-center gap-4 mt-2">
            <p className="font-body text-sm text-on-surface-variant opacity-70">
              {doctors.length} specialists available
            </p>
            <div className="flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse" />
              <span className="font-label text-[10px] text-tertiary uppercase tracking-wide">{onlineCount} online now</span>
            </div>
          </div>
        </header>

        {/* Desktop Split-Pane Layout */}
        <div className="flex flex-col xl:flex-row gap-8">
          
          {/* ── Left Column: Faceted Search & Filters (Sticky on Desktop) ── */}
          <div className="xl:w-64 xl:shrink-0 flex flex-col gap-6 xl:sticky xl:top-8 self-start">
            {/* Search */}
          <div className="relative flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 material-symbols-outlined text-outline text-base">search</span>
            <input
              type="search"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or specialization…"
              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-full pl-11 pr-5 py-3 text-on-surface font-body text-sm outline-none focus:border-primary transition-all"
            />
          </div>

            {/* Specialty List (Vertical on Desktop, Horizontal Pills on Mobile) */}
            <div>
              <p className="font-label text-[10px] uppercase tracking-widest text-outline mb-3">Specialities</p>
              <div className="flex xl:flex-col gap-2 flex-wrap">
                {SPECIALIZATIONS.map(s => (
                  <button
                    key={s}
                    onClick={() => setFilter(s)}
                    className={`px-4 py-2 xl:py-2.5 rounded-full xl:rounded-xl font-label text-[11px] uppercase tracking-wide transition-all xl:text-left ${
                      filter === s
                        ? 'bg-primary text-on-primary shadow-lg shadow-primary/20'
                        : 'bg-surface-container-low border border-outline-variant/10 text-on-surface-variant hover:text-on-surface hover:border-outline-variant/30 xl:bg-transparent xl:border-transparent'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Column: Doctor Grid ── */}
          <div className="flex-1">

        {/* Doctor grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {[1,2,3,4,5,6].map(i => (
              <div key={i} className="h-52 rounded-2xl bg-surface-container-low animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <span className="material-symbols-outlined text-5xl text-outline opacity-30">search_off</span>
            <p className="font-headline text-lg text-on-surface mt-4">No doctors found</p>
            <p className="font-body text-sm text-on-surface-variant mt-2 opacity-60">Try a different search term or specialty</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((doc, i) => (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
              >
                <DoctorCard doctor={doc} onConsult={handleConsult} />
              </motion.div>
            ))}
          </div>
        )}
          </div>
        </div>
      </div>
    </div>
  );
}
