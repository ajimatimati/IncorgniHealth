import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useSocket } from '../context/SocketContext';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import AvatarGenerator from '../components/AvatarGenerator';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import DiagnosticOverview from '../components/DiagnosticOverview';
import { Clock, MessageCircle, CheckCircle, CircleDollarSign, Stethoscope } from 'lucide-react';

const Icons = {
  queue: <Clock className="w-5 h-5" strokeWidth={1.5} />,
  chat: <MessageCircle className="w-5 h-5" strokeWidth={1.5} />,
  check: <CheckCircle className="w-5 h-5" strokeWidth={1.5} />,
  money: <CircleDollarSign className="w-5 h-5" strokeWidth={1.5} />,
  stethoscope: <Stethoscope className="w-6 h-6" strokeWidth={1.5} />,
};

const STAT_COLOURS = [
  { icon: 'text-[#6D28D9]', bg: 'bg-[#F5F3FF]' }, // Violet
  { icon: 'text-[#D97706]', bg: 'bg-[#FEF3C7]' }, // Amber
  { icon: 'text-[#059669]', bg: 'bg-[#D1FAE5]' }, // Green
  { icon: 'text-[#18181B]', bg: 'bg-[#F4F4F5]' }, // Gray
];

const DoctorDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ completed: 0, active: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const [incomingPatients, setIncomingPatients] = useState([]);
  const [selectedPatient, setSelectedPatient] = useState(null);

  const navigate = useNavigate();
  const { user } = useAuth();
  const { socket } = useSocket();
  const toast = useToast();

  useEffect(() => {
    if (!user || user.role !== 'DOCTOR') { navigate('/auth'); return; }
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/doctor/queue'),
          api.get('/doctor/stats'),
        ]);
        if (results[0].status === 'fulfilled') setQueue(results[0].value.data);
        if (results[1].status === 'fulfilled') setStats(results[1].value.data);
      } finally { setLoading(false); }
    };
    fetchData();
    const interval = setInterval(fetchData, 10000);

    if (socket && user.publicId) {
      socket.emit('doctor-join', user.publicId);
      socket.on('patient-arrived', (p) => {
        setIncomingPatients(prev => prev.find(x => x.socketId === p.socketId) ? prev : [...prev, p]);
        toast.success(`${p.nickname || 'A client'} is ready to be seen.`);
      });
      socket.on('active-patients', setIncomingPatients);
      socket.on('patient-left', (sid) => setIncomingPatients(prev => prev.filter(p => p.socketId !== sid)));
    }
    return () => {
      clearInterval(interval);
      if (socket) { socket.off('patient-arrived'); socket.off('active-patients'); socket.off('patient-left'); }
    };
  }, [navigate, user, socket]);

  const handleClaim = async (id) => {
    try {
      await api.post(`/doctor/claim/${id}`);
      toast.success('Client assigned successfully!');
      navigate(`/chat/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not assign client.');
    }
  };

  const handleAdmit = (socketId) => {
    const queueItem = queue.find(c => c.patient?.id === selectedPatient?.id);
    const consultId = queueItem ? queueItem.id : 'demo';
    socket.emit('admit-patient', { to: socketId, roomId: consultId });
    navigate(`/consult/${consultId}`);
  };

  const statCards = [
    { label: 'In Queue',   value: queue.filter(c => c.status === 'PENDING').length, icon: Icons.queue },
    { label: 'Active',     value: queue.filter(c => c.status === 'ACTIVE').length,  icon: Icons.chat },
    { label: 'Completed',  value: stats.completed,                                  icon: Icons.check },
    { label: 'Earnings',   value: `₦${stats.totalEarnings.toLocaleString()}`,       icon: Icons.money },
  ];

  return (
    <div className="min-h-dvh pb-28 lg:pb-0 font-sans bg-[#F8F7F6]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="px-4 pt-6 lg:px-10 lg:pt-10 max-w-[1400px] mx-auto"
      >
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-[#E8E6E3] shadow-card-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[#6D28D9] bg-[#F5F3FF]">
              {Icons.stethoscope}
            </div>
            <div>
              <p className="text-[11px] font-bold text-[#A1A1AA] uppercase tracking-wider mb-0.5">Clinical Dashboard</p>
              <h1 className="text-2xl font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                Dr. {user?.nickname || user?.publicId?.slice(0, 8)}
              </h1>
              <p className="text-[11px] text-[#059669] font-bold flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#059669]" /> Online &amp; Ready
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="section-label mb-1">Authenticated ID</p>
            <p className="text-sm font-bold text-[#18181B] bg-[#F4F4F5] px-3 py-1.5 rounded-lg">{user?.publicId || 'SYS_PENDING'}</p>
          </div>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((s, i) => (
            <div key={i} className="p-5 bg-white rounded-2xl border border-[#E8E6E3] shadow-card-sm flex flex-col justify-between">
              <div className="flex justify-between items-start mb-5">
                <span className={`p-3 rounded-xl ${STAT_COLOURS[i].icon} ${STAT_COLOURS[i].bg}`}>
                  {s.icon}
                </span>
                <span className="text-3xl font-black text-[#18181B] tracking-tight">
                  {s.value}
                </span>
              </div>
              <p className="section-label border-t border-[#F0EDED] pt-3">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-12">
          {/* ── Left: Queues ── */}
          <div className="lg:col-span-4 xl:col-span-4 flex flex-col gap-6">

            {/* Live Waiting Room */}
            <div className="p-5 bg-white rounded-2xl border border-[#E8E6E3] shadow-card-sm">
              <h2 className="section-label flex items-center gap-2 mb-4">
                <span className="w-2 h-2 rounded-full bg-[#6D28D9]" />
                Waiting Room
              </h2>
              <AnimatePresence>
                {incomingPatients.length === 0 ? (
                  <p className="text-[12px] font-semibold text-[#A1A1AA] py-6 text-center">No clients currently queued.</p>
                ) : (
                  <div className="space-y-3">
                    {incomingPatients.map((p) => (
                      <motion.div key={p.socketId} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }}
                        className="flex items-center justify-between p-4 bg-[#F9F9FB] rounded-xl border border-[#F0EDED]"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#6D28D9] bg-[#F5F3FF] font-black text-sm uppercase">
                            {p.nickname?.[0] || 'P'}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-[#18181B]">{p.nickname || 'Unknown Client'}</p>
                            <p className="text-[10.5px] font-semibold text-[#A1A1AA] uppercase tracking-wider mt-0.5">Ready to connect</p>
                          </div>
                        </div>
                        <RippleButton variant="violet" size="sm" onClick={() => handleAdmit(p.socketId)}>Admit</RippleButton>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </div>

            {/* General Queue */}
            <div className="flex-1 p-5 bg-white rounded-2xl border border-[#E8E6E3] shadow-card-sm flex flex-col">
              <div className="flex items-center justify-between mb-4 border-b border-[#F0EDED] pb-3">
                <h2 className="section-label">General Queue</h2>
                <span className="text-[11px] font-bold text-[#18181B] bg-[#F4F4F5] px-2.5 py-1 rounded-full">
                  {queue.length} waiting
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-20 rounded-xl bg-[#F4F4F5] animate-pulse" />)}</div>
              ) : queue.length === 0 ? (
                <div className="py-12 flex-1 flex flex-col items-center justify-center text-center">
                  <p className="text-[12px] font-bold text-[#A1A1AA]">No historic queue items.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {queue.map((consult) => {
                    const isSelected = selectedPatient?.id === consult.patient?.id;
                    return (
                      <div key={consult.id} onClick={() => setSelectedPatient(consult.patient)}
                        className={`p-4 rounded-xl cursor-pointer transition-all border ${
                          isSelected ? 'bg-[#F9F9FB] border-[#6D28D9] shadow-[0_0_0_1px_rgba(109,40,217,1)]' : 'bg-white border-[#E8E6E3] hover:border-[#D4D4D8]'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <AvatarGenerator seed={consult.patient?.publicId} size="md" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] font-bold text-[#18181B] truncate">{consult.patient?.nickname || consult.patient?.publicId}</p>
                            <p className="text-[11px] font-semibold text-[#A1A1AA] uppercase tracking-wider mt-0.5">
                              {consult.patient?.sex || 'U'} · {consult.patient?.age || '--'} yrs
                            </p>
                          </div>
                        </div>
                        <div className="mt-3 pt-3 border-t border-[#F0EDED] flex items-center justify-between">
                          <span className="text-[11px] font-bold text-[#71717A]">
                            {new Date(consult.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!consult.doctorId ? (
                            <RippleButton size="sm" onClick={(e) => { e.stopPropagation(); handleClaim(consult.id); }}>
                              Claim
                            </RippleButton>
                          ) : (
                            <RippleButton variant="secondary" size="sm" onClick={(e) => { e.stopPropagation(); navigate(`/chat/${consult.id}`); }}>
                              Resume
                            </RippleButton>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* ── Right: 3D Diagnostic Workspace ── */}
          <div className="lg:col-span-8 xl:col-span-8 flex flex-col" style={{ minHeight: '480px' }}>
            {selectedPatient ? (
              <div className="relative flex-1 rounded-2xl overflow-hidden" style={{ minHeight: '480px' }}>
                <DiagnosticOverview title="Clinical Assessment" patientData={selectedPatient} readOnly />
                <div className="absolute bottom-6 right-6 z-20 flex gap-3">
                  <RippleButton
                    variant="primary"
                    onClick={() => navigate(`/chat/${queue.find(c => c.patient?.id === selectedPatient.id)?.id}`)}
                  >
                    {Icons.chat}
                    Open Chat
                  </RippleButton>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center rounded-2xl bg-white border border-[#E8E6E3] shadow-card-sm" style={{ minHeight: '480px' }}>
                <div className="w-16 h-16 rounded-full flex items-center justify-center mb-5 text-[#A1A1AA] bg-[#F4F4F5]">
                  {Icons.stethoscope}
                </div>
                <p className="text-[16px] font-black text-[#18181B] mb-2" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>Select a Client</p>
                <p className="text-[13px] text-[#71717A] max-w-xs text-center leading-relaxed">
                  Choose a client from the queue to load their 3D diagnostic overview and vitals.
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default DoctorDashboard;
