import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import api from '../api';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';

/* ─── SVG Icons ─── */
const Icons = {
  pill: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" /></svg>,
  time: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  check: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  mix: <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.375 3.375 0 01-4.769.06l-.311-.31a3.375 3.375 0 00-4.773-.063L5 14.5m14 0V17a3 3 0 01-3 3h-2.25a.75.75 0 01-.75-.75V17" /></svg>,
  empty: <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3M12 15.75h3M12 7.5v4.75" /></svg>,
};

const PharmacyDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/pharmacy/feed');
      setOrders(res.data.data || []);
    } catch {
      console.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      await api.post(`/pharmacy/accept/${orderId}`, { pharmacistId: user?.id || 'unknown' });
      toast.success('Order accepted.');
      fetchOrders();
    } catch {
      toast.error('Could not accept order.');
    }
  };

  const handleReady = async (orderId) => {
    try {
      await api.post(`/pharmacy/ready/${orderId}`);
      toast.success('Marked as ready.');
      fetchOrders();
    } catch {
      toast.error('Update failed.');
    }
  };

  const pending = orders.filter(o => o.status === 'PENDING');
  const processing = orders.filter(o => o.status === 'PROCESSING');
  const ready = orders.filter(o => o.status === 'READY_FOR_PICKUP');

  const columns = [
    { title: 'New Orders', items: pending, emptyText: 'No pending orders', highlight: 'border-t-amber-500/50' },
    { title: 'In Progress', items: processing, emptyText: 'No active preps', highlight: 'border-t-accent-blue/50' },
    { title: 'Ready for Pickup', items: ready, emptyText: 'Awaiting pickup', highlight: 'border-t-emerald-500/50' },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="p-6 lg:p-8 max-w-7xl mx-auto relative z-10"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Pharmacy Orders</h1>
          <p className="text-sm text-text-muted mt-1">Live fulfillment feed</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="glass-card px-4 py-2 border border-white/10">
            <p className="text-[10px] text-text-dim uppercase tracking-wider">Pharmacist</p>
            <p className="text-sm font-mono font-bold text-action">{user?.publicId || 'N/A'}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-text-dim">
            <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse-soft" />
            Live
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-8">
        {[
          { label: 'Incoming', value: pending.length, color: 'text-amber-400', icon: Icons.time, bg: 'bg-amber-500/10' },
          { label: 'Preparing', value: processing.length, color: 'text-accent-blue', icon: Icons.mix, bg: 'bg-blue-500/10' },
          { label: 'Ready', value: ready.length, color: 'text-emerald-400', icon: Icons.check, bg: 'bg-emerald-500/10' },
        ].map((s, i) => (
          <div key={i} className={`glass-card p-4 flex items-center justify-between ${s.bg}`}>
            <div>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
              <p className="text-xs text-text-muted mt-1 uppercase tracking-wide">{s.label}</p>
            </div>
            <div className={`opacity-50 ${s.color}`}>{s.icon}</div>
          </div>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-action/30 border-t-action rounded-full animate-spin" />
        </div>
      ) : orders.length === 0 ? (
        <EmptyState
          svgIcon={Icons.empty}
          title="No orders"
          description="Prescriptions issued by doctors will appear here."
        />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {columns.map((col, ci) => (
            <div key={ci} className="flex flex-col h-full">
              <h2 className="text-sm font-bold text-text-primary mb-3 flex justify-between">
                {col.title} <span className="bg-white/10 px-2 rounded-md text-xs py-0.5">{col.items.length}</span>
              </h2>
              <div className="space-y-3 flex-1">
                {col.items.length === 0 ? (
                  <div className="border border-dashed border-white/10 rounded-xl p-6 text-center">
                    <p className="text-sm text-text-dim">{col.emptyText}</p>
                  </div>
                ) : (
                  col.items.map((order, i) => (
                    <div
                      key={order.id}
                      className={`glass-card p-4 border-t-2 ${col.highlight} animate-slide-up hover:translate-y-[-2px] transition-transform`}
                      style={{ animationDelay: `${i * 0.05}s`, animationFillMode: 'both' }}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="font-mono font-bold text-sm text-text-primary">{order.publicOrderId}</p>
                          <p className="text-[10px] text-text-dim mt-0.5">Order ID</p>
                        </div>
                        <StatusBadge status={order.status} />
                      </div>

                      <div className="bg-surface/50 rounded-lg p-3 mb-3 border border-white/5">
                        <p className="text-[10px] text-text-dim uppercase tracking-wider mb-2">Prescription</p>
                        {order.medications?.length > 0 ? (
                          <div className="space-y-1">
                            {order.medications.map((med, idx) => (
                              <div key={idx} className="flex justify-between text-sm">
                                <span className="text-text-secondary">{med.name}</span>
                                <span className="text-action font-medium">{med.dosage}</span>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-xs text-text-dim italic">No items</p>
                        )}
                      </div>

                      <div className="pt-2 gap-2 flex flex-col">
                        {order.status === 'PENDING' && (
                          <RippleButton onClick={() => handleAccept(order.id)} className="w-full text-xs py-2 justify-center">
                            Accept Order
                          </RippleButton>
                        )}
                        {order.status === 'PROCESSING' && (
                          <RippleButton onClick={() => handleReady(order.id)} variant="secondary" className="w-full text-xs py-2 justify-center border-accent-blue/50 text-accent-blue hover:bg-accent-blue/10">
                            Mark Ready
                          </RippleButton>
                        )}
                        {order.status === 'READY_FOR_PICKUP' && (
                          <div className="text-center bg-white/5 rounded-lg p-2 border border-dashed border-white/10">
                            <p className="text-[10px] text-text-dim mb-1">Pickup Code</p>
                            <p className="text-lg font-mono font-bold tracking-[0.2em] text-text-primary">{order.secureCode || '****'}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default PharmacyDashboard;
