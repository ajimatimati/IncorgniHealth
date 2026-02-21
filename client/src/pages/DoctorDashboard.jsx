import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import AvatarGenerator from '../components/AvatarGenerator';
import api from '../api';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';

/* ─── SVG Icons ─── */
const Icons = {
  queue: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  chat: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.159 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>,
  check: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  money: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  empty: <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
};

const DoctorDashboard = () => {
  const [queue, setQueue] = useState([]);
  const [stats, setStats] = useState({ completed: 0, active: 0, totalEarnings: 0 });
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { user } = useAuth();
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
      } catch {
        // Silent fail
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000);
    return () => clearInterval(interval);
  }, [navigate, user]);

  const handleClaim = async (id) => {
    try {
      await api.post(`/doctor/claim/${id}`);
      toast.success('Patient claimed!');
      navigate(`/chat/${id}`);
    } catch (err) {
      toast.error(err.response?.data?.msg || 'Could not claim patient.');
    }
  };

  const statCards = [
    { label: 'In Queue', value: queue.filter(c => c.status === 'PENDING').length, color: 'text-amber-400', bg: 'bg-amber-500/10', icon: Icons.queue },
    { label: 'Active', value: queue.filter(c => c.status === 'ACTIVE').length, color: 'text-cyan-400', bg: 'bg-cyan-500/10', icon: Icons.chat },
    { label: 'Completed', value: stats.completed, color: 'text-emerald-400', bg: 'bg-emerald-500/10', icon: Icons.check },
    { label: 'Earnings', value: `₦${stats.totalEarnings.toLocaleString()}`, color: 'text-action', bg: 'bg-action/10', icon: Icons.money },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="p-6 lg:p-8 max-w-7xl mx-auto relative z-10"
    >
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Medical Dashboard</h1>
          <p className="text-sm text-text-muted mt-1">
            Status: <span className="text-emerald-400 font-medium">Online & Visible</span>
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <p className="text-sm font-bold text-text-primary">{new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((stat, i) => (
          <div key={i} className={`glass-card p-5 flex items-center gap-4 ${stat.bg} animate-slide-up`} style={{ animationDelay: `${i * 0.05}s` }}>
             <div className={`p-3 rounded-xl bg-white/5 ${stat.color}`}>
               {stat.icon}
             </div>
             <div>
               <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
               <p className="text-xs text-text-muted font-medium uppercase tracking-wide">{stat.label}</p>
             </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Queue Column */}
        <div className="lg:col-span-1 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-text-primary uppercase tracking-wider">Patient Queue</h2>
            <span className="badge bg-white/5 text-text-muted">{queue.length}</span>
          </div>

          {loading ? (
             <div className="space-y-3">
               {[1,2,3].map(i => <div key={i} className="h-20 bg-surface rounded-xl animate-pulse" />)}
             </div>
          ) : queue.length === 0 ? (
             <EmptyState title="Queue Empty" description="Relax, no patients waiting." svgIcon={Icons.empty} />
          ) : (
            <div className="space-y-3">
              {queue.map((consult, i) => (
                <div key={consult.id} className="glass-card p-4 hover:bg-surface-alt/50 transition duration-300 animate-slide-up" style={{ animationDelay: `${i * 0.05}s` }}>
                  <div className="flex items-center gap-3">
                    <AvatarGenerator seed={consult.patient?.publicId} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm text-action truncate">{consult.patient?.nickname || consult.patient?.publicId}</p>
                      <p className="text-xs text-text-muted truncate">
                         {consult.patient?.sex} • {consult.patient?.age}yo
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-text-dim px-2 py-1 rounded bg-white/5">
                      {new Date(consult.createdAt).toLocaleTimeString([], { hour: '2-digit', minute:'2-digit' })}
                    </span>
                    {!consult.doctorId ? (
                      <RippleButton onClick={() => handleClaim(consult.id)} className="text-xs px-4 py-1.5 justify-center">
                        Accept
                      </RippleButton>
                    ) : (
                      <RippleButton onClick={() => navigate(`/chat/${consult.id}`)} variant="secondary" className="text-xs px-4 py-1.5 justify-center">
                        Resume
                      </RippleButton>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Workspace/Preview Area */}
        <div className="lg:col-span-2 hidden lg:flex items-center justify-center glass-panel border border-dashed border-white/10 rounded-2xl min-h-[500px] bg-secondary/30">
           <div className="text-center max-w-xs">
             <div className="w-20 h-20 rounded-full bg-surface-alt flex items-center justify-center mx-auto mb-6 text-text-dim">
               {Icons.chat}
             </div>
             <h3 className="text-lg font-medium text-text-primary mb-2">Workspace Ready</h3>
             <p className="text-sm text-text-muted">Select a patient from the queue to view details and start consultation.</p>
           </div>
        </div>
      </div>
    </motion.div>
  );
};

export default DoctorDashboard;
