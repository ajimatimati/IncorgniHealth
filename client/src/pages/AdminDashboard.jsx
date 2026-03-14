import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import PullToRefresh from '../components/PullToRefresh';
import AvatarGenerator from '../components/AvatarGenerator';
import { motion } from 'framer-motion';
import { Users, Stethoscope, MessageSquare, Box, Banknote, Lock } from 'lucide-react';

/* ─── SVG Icons ─── */
const Icons = {
  users: <Users className="w-6 h-6" strokeWidth={1.5} />,
  doc: <Stethoscope className="w-6 h-6" strokeWidth={1.5} />,
  chat: <MessageSquare className="w-6 h-6" strokeWidth={1.5} />,
  box: <Box className="w-6 h-6" strokeWidth={1.5} />,
  money: <Banknote className="w-6 h-6" strokeWidth={1.5} />,
  lock: <Lock className="w-16 h-16" strokeWidth={1.5} />,
};

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState('overview');
  const [roleFilter, setRoleFilter] = useState('');

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/admin/metrics'),
        api.get('/admin/users', { params: { limit: 50, ...(roleFilter && { role: roleFilter }) } }),
      ]);
      if (results[0].status === 'fulfilled') setMetrics(results[0].value.data);
      if (results[1].status === 'fulfilled') setUsers(results[1].value.data.data || []);
    } catch {
      toast.error('Could not refresh admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [roleFilter]);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex items-center justify-center h-[80vh]">
        <div className="text-center p-8 bg-surface border border-white/5 rounded-2xl max-w-sm">
          <div className="text-red-500 mb-4 flex justify-center">{Icons.lock}</div>
          <h2 className="text-xl font-bold text-text-primary mb-2">Access Denied</h2>
          <p className="text-text-muted">You do not have permission to view the admin console.</p>
        </div>
      </div>
    );
  }

  const statCards = metrics ? [
    { label: 'Total Users', value: metrics.users.total, icon: Icons.users, gradient: 'from-violet-600/20 to-purple-600/20', color: 'text-violet-400' },
    { label: 'Practitioners', value: metrics.users.doctors, icon: Icons.doc, gradient: 'from-emerald-600/20 to-teal-600/20', color: 'text-emerald-400' },
    { label: 'Consultations', value: metrics.consultations.active, icon: Icons.chat, gradient: 'from-amber-600/20 to-orange-600/20', color: 'text-amber-400' },
    { label: 'Total Orders', value: metrics.orders.total, icon: Icons.box, gradient: 'from-blue-600/20 to-cyan-600/20', color: 'text-cyan-400' },
    { label: 'Revenue', value: `₦${(metrics.revenue.platformFees || 0).toLocaleString()}`, icon: Icons.money, gradient: 'from-rose-600/20 to-pink-600/20', color: 'text-rose-400' },
  ] : [];

  return (
    <PullToRefresh onRefresh={fetchData}>
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        transition={{ duration: 0.4 }}
        className="p-4 lg:p-8 max-w-7xl mx-auto relative z-10"
      >
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-text-primary">Admin Overview</h1>
          <p className="text-text-muted mt-1">Platform metrics and user management</p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-white/10 pb-1">
          {['overview', 'users'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-t-lg text-sm font-medium transition-all relative ${
                tab === t ? 'text-action' : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {tab === t && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-action" />}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-surface rounded-2xl animate-pulse" />)}
          </div>
        ) : tab === 'overview' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {statCards.map((card, i) => (
              <div key={i} className={`rounded-2xl p-6 bg-gradient-to-br border border-white/5 ${card.gradient} animate-slide-up`} style={{ animationDelay: `${i*0.05}s` }}>
                <div className={`mb-4 w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center ${card.color}`}>
                  {card.icon}
                </div>
                <p className="text-sm text-text-secondary font-medium uppercase tracking-wide opacity-80">{card.label}</p>
                <p className={`text-2xl font-bold mt-1 ${card.color}`}>{card.value}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="animate-fade-in">
            <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
              {['', 'PATIENT', 'DOCTOR', 'PHARMACIST', 'RIDER'].map(r => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(r)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border ${
                    roleFilter === r ? 'bg-action border-action text-white' : 'bg-surface border-white/10 text-text-muted hover:border-white/20'
                  }`}
                >
                  {r || 'All Roles'}
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-white/10 overflow-hidden bg-surface">
              <table className="w-full text-sm text-left">
                <thead className="bg-white/5 text-text-muted font-medium">
                  <tr>
                    <th className="px-5 py-3">User</th>
                    <th className="px-5 py-3">Role</th>
                    <th className="px-5 py-3 hidden sm:table-cell">Status</th>
                    <th className="px-5 py-3 hidden lg:table-cell">Joined</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {users.map(u => (
                    <tr key={u.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <AvatarGenerator seed={u.publicId} size="sm" />
                          <div>
                            <p className="font-mono text-xs font-bold text-text-primary">{u.publicId}</p>
                            <p className="text-[10px] text-text-dim truncate max-w-[100px]">{u.nickname || 'No nickname'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded text-text-secondary font-medium">
                          {u.role}
                        </span>
                      </td>
                      <td className="px-5 py-3 hidden sm:table-cell">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${u.isOnline ? 'bg-emerald-400' : 'bg-slate-600'}`} />
                        <span className="text-xs text-text-muted">{u.isOnline ? 'Online' : 'Offline'}</span>
                      </td>
                      <td className="px-5 py-3 hidden lg:table-cell text-text-dim text-xs font-mono">
                        {new Date(u.createdAt).toISOString().split('T')[0]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {users.length === 0 && <div className="p-8 text-center text-text-muted">No users found.</div>}
            </div>
          </div>
        )}
      </motion.div>
    </PullToRefresh>
  );
}
