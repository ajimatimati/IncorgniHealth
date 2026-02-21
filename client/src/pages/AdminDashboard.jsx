import { useState, useEffect } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import PullToRefresh from '../components/PullToRefresh';
import AvatarGenerator from '../components/AvatarGenerator';
import { motion } from 'framer-motion';

/* ─── SVG Icons ─── */
const Icons = {
  users: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" /></svg>,
  doc: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.745 3.745 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>,
  chat: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3c-1.354 0-2.694-.055-4.02-.163a2.115 2.115 0 01-.825-.242m9.345-8.334a2.126 2.126 0 00-.476-.095 48.64 48.64 0 00-8.048 0c-1.131.094-1.976 1.057-1.976 2.192v4.286c0 .837.46 1.58 1.155 1.951m9.345-8.334V6.637c0-1.621-1.152-3.026-2.76-3.235A48.455 48.455 0 0011.25 3c-2.115 0-4.198.137-6.24.402-1.608.209-2.76 1.614-2.76 3.235v6.226c0 1.621 1.152 3.026 2.76 3.235.577.075 1.157.14 1.74.194V21l4.155-4.155" /></svg>,
  box: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3M12 15.75h3M12 7.5v4.75" /></svg>,
  money: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  lock: <svg className="w-16 h-16" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" /></svg>,
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
