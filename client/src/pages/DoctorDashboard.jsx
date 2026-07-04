import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import api from '../api';
import DiagnosticOverview from '../components/DiagnosticOverview';

// Deterministic mock vitals generator based on patient ID
function getMockVitals(publicId) {
  if (!publicId) return {
    heartRate:     72,
    bloodPressure: '120/80',
    weight:        '75kg',
    height:        '180cm',
    bmi:           '23.1',
    temperature:   '36.8°C',
    oxygen:        '98%',
    status:        'Optimal',
  };
  let hash = 0;
  for (let i = 0; i < publicId.length; i++) {
    hash = publicId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const heartRate = 60 + Math.abs(hash % 30);
  const bpSys = 110 + Math.abs((hash >> 2) % 25);
  const bpDia = 70 + Math.abs((hash >> 4) % 15);
  const temp = (36.2 + Math.abs((hash >> 6) % 12) / 10).toFixed(1);
  const oxygen = 95 + Math.abs((hash >> 8) % 5);
  const bmi = (20.5 + Math.abs((hash >> 10) % 70) / 10).toFixed(1);
  
  return {
    heartRate,
    bloodPressure: `${bpSys}/${bpDia}`,
    weight: `${70 + Math.abs((hash >> 12) % 20)}kg`,
    height: `${170 + Math.abs((hash >> 14) % 20)}cm`,
    bmi,
    temperature: `${temp}°C`,
    oxygen: `${oxygen}%`,
    status: heartRate > 85 || bpSys > 130 ? 'Caution' : 'Optimal',
  };
}


// ── Queue card ──────────────────────────────────────────────────────────────
function QueueCard({ consult, onClaim, onResume }) {
  const claimed = consult.status === 'ACTIVE';
  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
            <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
          </div>
          <div>
            <p className="font-headline text-sm font-semibold text-on-surface">
              Pt. {consult.patient?.publicId || 'Unknown'}
            </p>
            <p className="font-label text-[10px] text-outline uppercase tracking-widest mt-0.5">
              {consult.patient?.age ? `${consult.patient.age}y` : '—'} · {consult.patient?.sex || '—'}
            </p>
          </div>
        </div>
        <span className={`font-label text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full ${
          claimed ? 'bg-primary/10 text-primary' : 'bg-surface-container-high text-outline'
        }`}>
          {claimed ? 'Claimed' : 'Available'}
        </span>
      </div>
      <div className="flex items-center gap-2 text-on-surface-variant">
        <span className="material-symbols-outlined text-sm">chat_bubble</span>
        <span className="font-label text-[11px]">{consult._count?.messages || 0} messages</span>
      </div>
      <button
        onClick={() => claimed ? onResume(consult.id) : onClaim(consult.id)}
        className={`w-full py-2.5 rounded-xl font-label text-[11px] uppercase tracking-widest transition-all
          ${claimed
            ? 'bg-primary text-on-primary hover:brightness-110'
            : 'bg-surface-container-high text-on-surface hover:bg-primary hover:text-on-primary'
          }`}
      >
        {claimed ? 'Resume Session' : 'Admit Patient'}
      </button>
    </div>
  );
}

// ── Waiting room patient chip ───────────────────────────────────────────────
function WaitingChip({ patient }) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-surface-container-low border border-outline-variant/10">
      <div className="relative">
        <div className="w-8 h-8 rounded-full bg-tertiary/10 flex items-center justify-center shrink-0">
          <span className="material-symbols-outlined text-tertiary text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
        </div>
        <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-tertiary border-2 border-background" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-headline text-xs text-on-surface truncate">{patient.publicId || 'Patient'}</p>
        <p className="font-label text-[9px] text-tertiary uppercase tracking-wide">Waiting in queue</p>
      </div>
    </div>
  );
}

export default function DoctorDashboard() {
  const { user } = useAuth();
  const { socket } = useSocket();

  const navigate = useNavigate();

  const [stats, setStats]         = useState(null);
  const [queue, setQueue]         = useState([]);
  const [waiting, setWaiting]     = useState([]);
  const [isOnline, setIsOnline]   = useState(false);
  const [loading, setLoading]     = useState(true);

  // Tri-Pane State
  const [activeTab, setActiveTab] = useState('queue'); // 'queue', 'active', 'waiting'
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isDiagnosticsOpen, setIsDiagnosticsOpen] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [statsRes, queueRes, profileRes] = await Promise.all([
        api.get('/doctor/stats'),
        api.get('/doctor/queue'),
        api.get('/user/profile'),
      ]);
      setStats(statsRes.data);
      setQueue(queueRes.data || []);
      setIsOnline(profileRes.data?.isOnline || false);
    } catch (err) {
      console.error('Doctor dashboard error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Real-time waiting room via socket
  useEffect(() => {
    if (!socket) return;
    socket.emit('doctor-join', user?.publicId);
    socket.on('active-patients', (patients) => setWaiting(patients));
    socket.on('patient-arrived', (p) => setWaiting(prev => [...prev.filter(x => x.socketId !== p.socketId), p]));
    socket.on('patient-left', (sid) => setWaiting(prev => prev.filter(x => x.socketId !== sid)));
    return () => {
      socket.off('active-patients');
      socket.off('patient-arrived');
      socket.off('patient-left');
    };
  }, [socket, user]);

  const handleToggleOnline = async () => {
    try {
      const res = await api.put('/doctor/availability', { isOnline: !isOnline });
      setIsOnline(res.data.isOnline);
    } catch (err) { console.error(err); }
  };

  const handleClaim = async (consultId) => {
    try {
      await api.post(`/doctor/claim/${consultId}`);
      navigate(`/chat/${consultId}`);
    } catch (err) { console.error(err); }
  };

  const handleResume = (consultId) => navigate(`/chat/${consultId}`);

  const pending   = queue.filter(c => c.status === 'PENDING');
  const active    = queue.filter(c => c.status === 'ACTIVE');

  return (
    <div className="bg-background min-h-full text-on-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em]">Doctor Portal</p>
            <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface mt-1">
              Dr. {user?.nickname || user?.publicId}
            </h1>
            <p className="font-body text-sm text-on-surface-variant mt-1 opacity-70">
              {user?.specialization || 'General Practitioner'}
            </p>
          </div>
          {/* Online toggle */}
          <button
            onClick={handleToggleOnline}
            className={`flex items-center gap-3 px-5 py-3 rounded-full border transition-all font-label text-sm
              ${isOnline
                ? 'bg-tertiary/10 border-tertiary/30 text-tertiary'
                : 'bg-surface-container-low border-outline-variant/20 text-on-surface-variant'
              }`}
          >
            <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-tertiary' : 'bg-outline'}`} />
            {isOnline ? 'Available' : 'Offline'} · Click to toggle
          </button>
        </header>

        {/* Stats bento */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {[
            { icon: 'queue',          label: 'In Queue',      value: pending.length,            color: 'text-outline'  },
            { icon: 'person_play',    label: 'Active Now',    value: active.length,             color: 'text-primary'  },
            { icon: 'check_circle',   label: 'Completed',     value: stats?.completed ?? '—',   color: 'text-tertiary' },
            { icon: 'payments',       label: 'Earnings',      value: `₦${(stats?.totalEarnings || 0).toLocaleString()}`, color: 'text-secondary' },
          ].map(s => (
            <div key={s.label} className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5">
              <span className={`material-symbols-outlined text-xl ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="font-headline text-2xl font-bold text-on-surface mt-3">{loading ? '—' : s.value}</p>
              <p className="font-label text-[10px] text-outline uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── Tri-Pane Desktop Layout ── */}
        <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-280px)] min-h-[600px]">
          
          {/* Pane 1: Master Queue List */}
          <div className="w-full lg:w-1/3 bg-surface-container-low border border-outline-variant/10 rounded-3xl p-5 flex flex-col">
            <div className="flex bg-surface-container-high rounded-full p-1 mb-4 shrink-0">
              {['waiting', 'queue', 'active'].map(tab => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 font-label text-[10px] uppercase tracking-widest py-2 rounded-full transition-all ${
                    activeTab === tab ? 'bg-surface shadow text-on-surface' : 'text-on-surface-variant hover:text-on-surface'
                  }`}
                >
                  {tab === 'queue' ? 'Pending' : tab}
                </button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3">
              {activeTab === 'waiting' && waiting.map(p => (
                <div key={p.socketId} onClick={() => setSelectedPatient({ type: 'waiting', data: p })} className={`cursor-pointer transition-all ${selectedPatient?.data?.socketId === p.socketId ? 'ring-2 ring-primary' : ''}`}>
                  <WaitingChip patient={p} />
                </div>
              ))}
              {activeTab === 'queue' && pending.map(c => (
                <div key={c.id} onClick={() => setSelectedPatient({ type: 'queue', data: c })} className={`cursor-pointer transition-all rounded-2xl ${selectedPatient?.data?.id === c.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg-surface-container-low' : ''}`}>
                  <QueueCard consult={c} onClaim={handleClaim} onResume={handleResume} />
                </div>
              ))}
              {activeTab === 'active' && active.map(c => (
                <div key={c.id} onClick={() => setSelectedPatient({ type: 'active', data: c })} className={`cursor-pointer transition-all rounded-2xl ${selectedPatient?.data?.id === c.id ? 'ring-2 ring-primary ring-offset-2 ring-offset-bg-surface-container-low' : ''}`}>
                  <QueueCard consult={c} onClaim={handleClaim} onResume={handleResume} />
                </div>
              ))}
              {((activeTab === 'waiting' && waiting.length === 0) || 
                (activeTab === 'queue' && pending.length === 0) || 
                (activeTab === 'active' && active.length === 0)) && (
                <div className="h-full flex flex-col items-center justify-center py-10 opacity-50">
                  <span className="material-symbols-outlined text-4xl mb-2">inbox</span>
                  <p className="font-label text-xs uppercase tracking-widest">List Empty</p>
                </div>
              )}
            </div>
          </div>

          {/* Pane 2: Detail View */}
          <div className="w-full lg:w-1/3 bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 flex flex-col overflow-y-auto custom-scrollbar">
            {selectedPatient ? (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mb-4">
                  <span className="material-symbols-outlined text-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>person</span>
                </div>
                <h2 className="font-headline text-2xl font-bold text-on-surface">
                  {selectedPatient.type === 'waiting' 
                    ? `Pt. ${selectedPatient.data.publicId || 'Unknown'}` 
                    : `Pt. ${selectedPatient.data.patient?.publicId || 'Unknown'}`}
                </h2>
                <p className="font-label text-xs text-outline uppercase tracking-widest mt-1">Profile & Vitals</p>
                
                <div className="grid grid-cols-2 gap-4 mt-8">
                  <div className="bg-surface-container-high rounded-xl p-3">
                    <p className="font-label text-[9px] text-outline uppercase tracking-widest mb-1">Status</p>
                    <p className="font-headline text-sm font-semibold capitalize">{selectedPatient.type}</p>
                  </div>
                  <div className="bg-surface-container-high rounded-xl p-3">
                    <p className="font-label text-[9px] text-outline uppercase tracking-widest mb-1">History</p>
                    <p className="font-headline text-sm font-semibold">Clean</p>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-outline-variant/10">
                  <p className="font-body text-sm text-on-surface-variant leading-relaxed opacity-70">
                    Patient detail records will be securely loaded from the backend when fully integrated. Check the Action tools to admit or examine this patient.
                  </p>
                </div>
                
                <button
                  onClick={() => setIsDiagnosticsOpen(true)}
                  className="w-full mt-6 bg-primary/10 border border-primary/20 text-primary hover:bg-primary hover:text-on-primary font-headline text-xs font-bold py-3.5 px-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">biotech</span>
                  Launch 3D Diagnostic scan
                </button>
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                <span className="material-symbols-outlined text-5xl mb-4">clinical_notes</span>
                <p className="font-headline text-lg">No Patient Selected</p>
                <p className="font-body text-xs mt-2">Select a patient from the queue to view their profile.</p>
              </div>
            )}
          </div>

          {/* Pane 3: Action & Utility Tools */}
          <div className="w-full lg:w-1/3 bg-surface-container border border-outline-variant/10 rounded-3xl p-6 flex flex-col">
             <div className="flex items-center gap-2 mb-6">
                <span className="material-symbols-outlined text-primary text-xl">medical_services</span>
                <h2 className="font-headline text-sm font-bold text-on-surface">Action Tools</h2>
             </div>
             
             {selectedPatient ? (
               <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
                  {selectedPatient.type !== 'waiting' && (
                    <button
                      onClick={() => selectedPatient.data.status === 'ACTIVE' ? handleResume(selectedPatient.data.id) : handleClaim(selectedPatient.data.id)}
                      className="w-full py-4 rounded-2xl bg-primary text-on-primary font-label text-xs uppercase tracking-widest hover:brightness-110 active:scale-95 transition-all shadow-lg shadow-primary/20 flex flex-col items-center justify-center gap-1"
                    >
                      <span className="material-symbols-outlined text-xl mb-1">{selectedPatient.data.status === 'ACTIVE' ? 'forum' : 'meeting_room'}</span>
                      {selectedPatient.data.status === 'ACTIVE' ? 'Resume Consultation' : 'Admit Patient Now'}
                    </button>
                  )}
                  {selectedPatient.type === 'waiting' && (
                    <div className="p-4 rounded-xl bg-tertiary/10 border border-tertiary/20 text-center">
                      <p className="font-label text-[10px] text-tertiary uppercase tracking-widest">Patient is in Waiting Room.</p>
                      <p className="font-body text-xs text-on-surface-variant mt-2 opacity-70">They have not created a consultation ticket yet.</p>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <button className="py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors flex flex-col items-center gap-2 group">
                      <span className="material-symbols-outlined text-outline group-hover:text-on-surface text-lg transition-colors">prescriptions</span>
                      <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">Write Rx</span>
                    </button>
                    <button className="py-3 rounded-xl bg-surface-container-high hover:bg-surface-container-highest transition-colors flex flex-col items-center gap-2 group">
                      <span className="material-symbols-outlined text-outline group-hover:text-on-surface text-lg transition-colors">lab_research</span>
                      <span className="font-label text-[9px] uppercase tracking-widest text-on-surface-variant">Order Lab</span>
                    </button>
                  </div>
               </div>
             ) : (
                <div className="h-full flex flex-col items-center justify-center opacity-30 text-center">
                  <span className="material-symbols-outlined text-4xl mb-3">touch_app</span>
                  <p className="font-body text-xs">Select a patient to access clinical tools.</p>
                </div>
             )}
          </div>
        </div>
      </div>

      {/* ── Modal for 3D Diagnostics ── */}
      <AnimatePresence>
        {isDiagnosticsOpen && selectedPatient && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setIsDiagnosticsOpen(false)}
            />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden w-full max-w-5xl shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-outline-variant/5 bg-surface-container-low/50 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">biotech</span>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Interactive Health Scan</h3>
                </div>
                <button
                  onClick={() => setIsDiagnosticsOpen(false)}
                  className="material-symbols-outlined text-outline hover:text-on-surface transition-colors p-2 bg-surface-container-high rounded-full"
                >
                  close
                </button>
              </div>
              
              {/* Diagnostic Overview Container */}
              <div className="p-6 bg-background">
                <DiagnosticOverview
                  patientData={{
                    nickname: selectedPatient.type === 'waiting' 
                      ? selectedPatient.data.publicId 
                      : selectedPatient.data.patient?.publicId,
                    age: selectedPatient.type === 'waiting'
                      ? selectedPatient.data.age
                      : selectedPatient.data.patient?.age
                  }}
                  vitals={getMockVitals(
                    selectedPatient.type === 'waiting' 
                      ? selectedPatient.data.publicId 
                      : selectedPatient.data.patient?.publicId
                  )}
                  title="Patient Virtual Chart"
                  readOnly={false}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
