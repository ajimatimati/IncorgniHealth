import { useState, useEffect, useMemo } from 'react';
import api from '../api';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import PullToRefresh from '../components/PullToRefresh';
import AvatarGenerator from '../components/AvatarGenerator';
import { motion, AnimatePresence } from 'framer-motion';

export default function AdminDashboard() {
  const { user } = useAuth();
  const toast = useToast();
  const [metrics, setMetrics] = useState(null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');

  const MOCK_AUDIT = [
    { id: 'tx-2b4f1', hash: 'fc92ce1d...', action: 'System Backup Initiated', time: '35m ago', type: 'system' },
    { id: 'tx-9a8b7', hash: 'e3b0c442...', action: 'SARC Report Accessed', time: '1h ago', type: 'sarc' },
    { id: 'tx-1c2d3', hash: '8d969eef...', action: 'Evidence Kit Logged', time: '2h ago', type: 'logistics' },
  ];

  const fetchData = async () => {
    try {
      const results = await Promise.allSettled([
        api.get('/admin/metrics'),
        api.get('/admin/users', { params: { limit: 100 } }),
      ]);
      if (results[0].status === 'fulfilled') setMetrics(results[0].value.data);
      if (results[1].status === 'fulfilled') setUsers(results[1].value.data.data || []);
    } catch {
      toast.error('Could not refresh admin data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  if (user?.role !== 'ADMIN') {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center p-6">
        <div className="text-center p-8 bg-surface-container-low border border-outline-variant/10 rounded-3xl max-w-sm">
          <div className="w-16 h-16 bg-error/10 text-error rounded-2xl flex items-center justify-center mx-auto mb-6">
            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>lock</span>
          </div>
          <h2 className="font-headline text-xl font-bold text-on-surface mb-2">Access Denied</h2>
          <p className="font-body text-sm text-on-surface-variant opacity-80">Requires System Root Clearance.</p>
        </div>
      </div>
    );
  }

  const statCards = metrics ? [
    { label: 'Total Users', value: metrics.users.total, icon: 'group', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', trend: '+12%' },
    { label: 'Practitioners', value: metrics.users.doctors, icon: 'stethoscope', color: 'text-secondary', bg: 'bg-secondary/10', border: 'border-secondary/20', trend: '+3%' },
    { label: 'Active Consults', value: metrics.consultations.active, icon: 'forum', color: 'text-tertiary', bg: 'bg-tertiary/10', border: 'border-tertiary/20', trend: 'Live' },
    { label: 'Logistics Queue', value: metrics.orders.total, icon: 'inventory_2', color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', trend: '-5%' },
    { label: 'Platform Revenue', value: `₦${(metrics.revenue.platformFees || 0).toLocaleString()}`, icon: 'payments', color: 'text-emerald-400', bg: 'bg-emerald-400/10', border: 'border-emerald-400/20', trend: '+24%' },
  ] : [];

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      const matchRole = roleFilter ? u.role === roleFilter : true;
      const matchStatus = statusFilter === 'ONLINE' ? u.isOnline : statusFilter === 'OFFLINE' ? !u.isOnline : true;
      const matchSearch = searchQuery ? (u.publicId?.toLowerCase().includes(searchQuery.toLowerCase()) || u.nickname?.toLowerCase().includes(searchQuery.toLowerCase())) : true;
      return matchRole && matchStatus && matchSearch;
    });
  }, [users, roleFilter, statusFilter, searchQuery]);

  return (
    <PullToRefresh onRefresh={fetchData}>
      <div className="bg-background min-h-full text-on-background">
        <main className="px-4 sm:px-6 lg:px-10 max-w-[1600px] mx-auto py-8 lg:py-10 space-y-8">
          
          {/* Header */}
          <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>admin_panel_settings</span>
                <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em]">Platform Overview</p>
              </div>
              <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface">Data Engine</h1>
            </div>
            <div className="flex gap-3">
               <button className="h-12 px-5 rounded-xl border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high transition-colors font-label text-[11px] uppercase tracking-widest text-on-surface shadow-sm flex items-center gap-2">
                 <span className="material-symbols-outlined text-[18px]">download</span>
                 Export CSV
               </button>
               <button className="h-12 w-12 rounded-xl border border-outline-variant/20 bg-surface-container hover:bg-surface-container-high transition-colors flex items-center justify-center text-on-surface">
                 <span className="material-symbols-outlined">settings</span>
               </button>
            </div>
          </header>

          {/* Analytics Grid */}
          {loading && !metrics ? (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {[...Array(5)].map((_, i) => <div key={i} className="h-32 bg-surface-container rounded-3xl animate-pulse" />)}
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              {statCards.map((card, i) => (
                <motion.div 
                  key={i} 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className={`relative overflow-hidden rounded-[32px] p-6 bg-surface-container-low border ${card.border} flex flex-col justify-between h-40 group`}
                >
                  <div className={`absolute -right-6 -top-6 w-32 h-32 rounded-full ${card.bg} blur-3xl opacity-50 group-hover:opacity-80 transition-opacity`} />
                  <div className="flex items-start justify-between relative z-10">
                    <div className={`w-12 h-12 rounded-2xl ${card.bg} flex items-center justify-center shrink-0`}>
                      <span className={`material-symbols-outlined ${card.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{card.icon}</span>
                    </div>
                    <span className={`font-mono text-[10px] ${card.trend.includes('-') ? 'text-error' : 'text-emerald-400'} bg-surface-container-highest px-2 py-1 rounded-md`}>
                      {card.trend}
                    </span>
                  </div>
                  <div className="relative z-10 mt-auto">
                    <p className="font-label text-[9px] text-outline uppercase tracking-widest mb-1">{card.label}</p>
                    <p className={`font-headline text-3xl font-black ${card.color} tracking-tight`}>{card.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}

          {/* Main Dashboard Layout */}
          <div className="flex flex-col lg:flex-row gap-6">
             
             {/* Left Panel: Filters & Audit */}
             <div className="lg:w-72 xl:w-80 shrink-0 space-y-6">
                
                {/* Search & Filters */}
                <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-6 flex flex-col gap-6">
                   <div>
                     <h3 className="font-headline text-sm font-bold text-on-surface mb-4">Registry Filter</h3>
                     <div className="relative">
                       <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-[20px]">search</span>
                       <input 
                         type="text" 
                         value={searchQuery}
                         onChange={(e) => setSearchQuery(e.target.value)}
                         placeholder="Search ID or alias..." 
                         className="w-full pl-11 pr-4 py-3 bg-surface-container rounded-xl border border-outline-variant/10 focus:border-primary focus:ring-1 focus:ring-primary outline-none font-body text-sm text-on-surface transition-all placeholder:text-outline/50"
                       />
                     </div>
                   </div>

                   <div className="space-y-3">
                     <label className="font-label text-[9px] text-outline uppercase tracking-widest">Clearance Level</label>
                     <select 
                       value={roleFilter} 
                       onChange={(e) => setRoleFilter(e.target.value)}
                       className="w-full p-3 bg-surface-container rounded-xl border border-outline-variant/10 outline-none font-body text-sm text-on-surface custom-scrollbar"
                     >
                       <option value="">All Roles</option>
                       <option value="PATIENT">Patient</option>
                       <option value="DOCTOR">Doctor</option>
                       <option value="PHARMACIST">Pharmacist</option>
                       <option value="RIDER">Rider</option>
                       <option value="SARC_OFFICER">SARC Response</option>
                     </select>
                   </div>

                   <div className="space-y-3">
                     <label className="font-label text-[9px] text-outline uppercase tracking-widest">Node Status</label>
                     <div className="flex bg-surface-container p-1 rounded-xl border border-outline-variant/10">
                        {['', 'ONLINE', 'OFFLINE'].map(status => (
                          <button 
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`flex-1 py-2 rounded-lg font-label text-[10px] uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-surface-container-highest text-on-surface shadow-sm' : 'text-outline hover:text-on-surface-variant'}`}
                          >
                            {status === '' ? 'ALL' : status}
                          </button>
                        ))}
                     </div>
                   </div>
                </div>

                {/* Audit Mini */}
                <div className="bg-surface-container-low rounded-[32px] border border-outline-variant/10 p-6">
                   <div className="flex items-center gap-2 mb-4">
                     <span className="w-2 h-2 rounded-full bg-error animate-pulse" />
                     <h3 className="font-headline text-sm font-bold text-on-surface">Live Ledger</h3>
                   </div>
                   <div className="space-y-4 relative before:absolute before:inset-0 before:ml-[11px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-outline-variant/20 before:to-transparent">
                     {MOCK_AUDIT.map((log, i) => (
                       <div key={i} className="relative flex items-center justify-between pl-8">
                         <div className="absolute left-0 w-6 h-6 rounded-full bg-surface-container-highest border-2 border-surface-container-low flex items-center justify-center z-10">
                           <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                         </div>
                         <div>
                           <p className="font-body text-xs font-medium text-on-surface">{log.action}</p>
                           <p className="font-mono text-[9px] text-outline mt-0.5">{log.hash}</p>
                         </div>
                         <span className="font-label text-[9px] text-on-surface-variant opacity-70 whitespace-nowrap ml-2">{log.time}</span>
                       </div>
                     ))}
                   </div>
                   <button className="w-full mt-6 py-2 border border-outline-variant/20 rounded-xl text-on-surface-variant font-label text-[9px] uppercase tracking-widest hover:bg-surface-container transition-colors">
                     Open Full Audit
                   </button>
                </div>
             </div>

             {/* Right Panel: Data Table Engine */}
             <div className="flex-1 bg-surface-container-low rounded-[32px] border border-outline-variant/10 flex flex-col overflow-hidden min-h-[500px]">
                <div className="p-6 border-b border-outline-variant/10 bg-surface-container-lowest/50 flex items-center justify-between">
                  <div>
                    <h2 className="font-headline text-base font-bold text-on-surface">Entity Registry</h2>
                    <p className="font-label text-[9px] text-outline uppercase tracking-[0.2em] mt-1">{filteredUsers.length} Records Found</p>
                  </div>
                  {/* Pagination placeholder */}
                  <div className="flex items-center gap-2">
                    <button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors disabled:opacity-30">
                      <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                    </button>
                    <span className="font-mono text-xs text-on-surface-variant px-2">1 / 1</span>
                    <button className="w-8 h-8 rounded-lg bg-surface-container flex items-center justify-center text-outline hover:text-on-surface transition-colors disabled:opacity-30">
                      <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                    </button>
                  </div>
                </div>

                <div className="flex-1 overflow-auto custom-scrollbar">
                  <table className="w-full text-left border-collapse whitespace-nowrap min-w-[800px]">
                    <thead className="sticky top-0 bg-surface-container-lowest/90 backdrop-blur-md z-10 shadow-sm border-b border-outline-variant/10">
                      <tr>
                        <th className="px-6 py-4 font-label text-[10px] text-outline uppercase tracking-widest font-semibold flex items-center gap-2">
                          Identity Node <span className="material-symbols-outlined text-[14px]">arrow_drop_down</span>
                        </th>
                        <th className="px-6 py-4 font-label text-[10px] text-outline uppercase tracking-widest font-semibold">Clearance</th>
                        <th className="px-6 py-4 font-label text-[10px] text-outline uppercase tracking-widest font-semibold">Network State</th>
                        <th className="px-6 py-4 font-label text-[10px] text-outline uppercase tracking-widest font-semibold">Registration Array</th>
                        <th className="px-6 py-4 font-label text-[10px] text-outline uppercase tracking-widest font-semibold text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-outline-variant/5">
                      {loading ? (
                        [...Array(5)].map((_, i) => (
                           <tr key={i}><td colSpan="5" className="px-6 py-4"><div className="h-10 bg-surface-container rounded-lg animate-pulse" /></td></tr>
                        ))
                      ) : filteredUsers.length === 0 ? (
                        <tr>
                          <td colSpan="5" className="p-16 text-center">
                            <span className="material-symbols-outlined text-4xl text-outline mb-3">folder_off</span>
                            <p className="font-body text-sm text-on-surface-variant opacity-70">Query returned zero matching entities.</p>
                          </td>
                        </tr>
                      ) : (
                        filteredUsers.map((u, i) => (
                          <motion.tr 
                            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }}
                            key={u.id} className="hover:bg-surface-container/50 transition-colors group cursor-pointer"
                          >
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-4">
                                <AvatarGenerator seed={u.publicId} size="md" />
                                <div>
                                  <p className="font-headline text-sm font-bold text-on-surface group-hover:text-primary transition-colors">{u.publicId}</p>
                                  <p className="font-body text-[11px] text-on-surface-variant opacity-70 truncate max-w-[150px]">{u.nickname || 'Ghost Identity'}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="inline-block px-3 py-1 bg-surface-container-highest rounded-full border border-outline-variant/10 font-label text-[9px] uppercase tracking-widest text-on-surface-variant">
                                {u.role.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-6 py-3">
                              <div className="flex items-center gap-2">
                                <span className="relative flex h-2.5 w-2.5">
                                  {u.isOnline && <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-50"></span>}
                                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${u.isOnline ? 'bg-primary' : 'bg-outline-variant/40'}`}></span>
                                </span>
                                <span className="font-body text-xs text-on-surface-variant opacity-80">{u.isOnline ? 'Online' : 'Offline'}</span>
                              </div>
                            </td>
                            <td className="px-6 py-3">
                              <span className="font-mono text-xs text-on-surface-variant opacity-60">
                                {new Date(u.createdAt).toISOString().split('T')[0]}
                              </span>
                            </td>
                            <td className="px-6 py-3 text-right">
                              <button className="p-2 rounded-lg text-outline hover:text-primary hover:bg-primary/10 transition-colors opacity-0 group-hover:opacity-100">
                                <span className="material-symbols-outlined text-[20px]">more_vert</span>
                              </button>
                            </td>
                          </motion.tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
             </div>
          </div>

        </main>
      </div>
    </PullToRefresh>
  );
}
