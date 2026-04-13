import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

// ── Status config ────────────────────────────────────────────────────────────
const STATUS_COLS = [
  { key: 'PENDING',          label: 'Inbound',       icon: 'inbox',           color: 'text-outline'  },
  { key: 'PROCESSING',       label: 'Preparing',     icon: 'pharmacy_badge',  color: 'text-tertiary' },
  { key: 'READY_FOR_PICKUP', label: 'Ready',         icon: 'check_circle',    color: 'text-primary'  },
];

// ── Order card ───────────────────────────────────────────────────────────────
function OrderCard({ order, onAccept, onReady }) {
  const meds = Array.isArray(order.prescription?.medications)
    ? order.prescription.medications
    : [];
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="font-headline text-sm font-semibold text-on-surface">
            #{order.publicOrderId || order.id?.slice(-6).toUpperCase()}
          </p>
          <p className="font-label text-[10px] text-outline uppercase tracking-wide mt-0.5">
            Pt. {order.patient?.publicId || '—'} · {date}
          </p>
        </div>
        <span className="font-label text-[9px] uppercase text-outline bg-surface-container-high px-2 py-0.5 rounded-full">
          {order.status?.toLowerCase().replace('_', ' ')}
        </span>
      </div>

      {meds.length > 0 && (
        <div className="space-y-1">
          {meds.slice(0, 3).map((m, i) => (
            <p key={i} className="font-body text-xs text-on-surface-variant opacity-80 truncate">
              • {typeof m === 'string' ? m : m.name || JSON.stringify(m)}
            </p>
          ))}
          {meds.length > 3 && (
            <p className="font-label text-[10px] text-outline">+{meds.length - 3} more</p>
          )}
        </div>
      )}

      {order.status === 'PENDING' && (
        <button
          onClick={() => onAccept(order.id)}
          className="w-full py-2 rounded-xl bg-primary text-on-primary font-label text-[11px] uppercase tracking-widest hover:brightness-110 transition-all"
        >
          Accept Order
        </button>
      )}
      {order.status === 'PROCESSING' && (
        <button
          onClick={() => onReady(order.id)}
          className="w-full py-2 rounded-xl bg-tertiary/10 text-tertiary border border-tertiary/20 font-label text-[11px] uppercase tracking-widest hover:bg-tertiary hover:text-background transition-all"
        >
          Mark Ready
        </button>
      )}
    </div>
  );
}

// ─── Main PharmacyDashboard ──────────────────────────────────────────────────
export default function PharmacyDashboard() {
  const [orders, setOrders]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState('ALL');
  const [visibleCounts, setVisibleCounts] = useState({
    PENDING: 10,
    PROCESSING: 10,
    READY_FOR_PICKUP: 10
  });

  const fetchOrders = useCallback(async () => {
    try {
      const res = await api.get('/pharmacy/orders');
      setOrders(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Pharmacy orders error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 30_000); // poll every 30s
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const handleAccept = async (id) => {
    try {
      await api.put(`/pharmacy/accept/${id}`);
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const handleReady = async (id) => {
    try {
      await api.put(`/pharmacy/ready/${id}`);
      fetchOrders();
    } catch (err) { console.error(err); }
  };

  const byStatus = (status) => orders.filter(o => o.status === status);
  const stats = [
    { icon: 'inbox',          label: 'Inbound',  value: byStatus('PENDING').length,          color: 'text-outline'  },
    { icon: 'pharmacy_badge', label: 'Preparing',value: byStatus('PROCESSING').length,        color: 'text-tertiary' },
    { icon: 'check_circle',   label: 'Ready',    value: byStatus('READY_FOR_PICKUP').length,  color: 'text-primary'  },
    { icon: 'local_shipping', label: 'Total',    value: orders.length,                        color: 'text-secondary'},
  ];

  return (
    <div className="bg-background min-h-full text-on-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        <header className="mb-8">
          <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em]">Pharmacy Portal</p>
          <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface mt-1">Order Pipeline</h1>
          <p className="font-body text-sm text-on-surface-variant mt-1 opacity-70">
            Real-time order queue — updates every 30 seconds.
          </p>
        </header>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {stats.map(s => (
            <div key={s.label} className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5">
              <span className={`material-symbols-outlined text-xl ${s.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{s.icon}</span>
              <p className="font-headline text-2xl font-bold text-on-surface mt-3">{loading ? '—' : s.value}</p>
              <p className="font-label text-[10px] text-outline uppercase tracking-widest mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Kanban grid — full width on desktop */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {STATUS_COLS.map(col => {
            const colOrders = byStatus(col.key);
            return (
              <div key={col.key} className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-5">
                {/* Column header */}
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <span className={`material-symbols-outlined text-base ${col.color}`} style={{ fontVariationSettings: "'FILL' 1" }}>{col.icon}</span>
                    <h2 className="font-headline text-sm font-bold text-on-surface">{col.label}</h2>
                  </div>
                  <span className={`font-label text-[10px] uppercase px-2 py-0.5 rounded-full bg-surface-container-high ${col.color}`}>
                    {colOrders.length}
                  </span>
                </div>

                {/* Cards */}
                <div className="flex flex-col flex-1 min-h-0">
                  <div className="space-y-3 min-h-[200px] flex-1 overflow-y-auto max-h-[50vh] lg:max-h-[calc(100vh-25rem)] pr-2 custom-scrollbar">
                    {loading ? (
                      <>
                        <div className="h-24 rounded-2xl bg-surface-container-high animate-pulse" />
                        <div className="h-24 rounded-2xl bg-surface-container-high animate-pulse" />
                      </>
                    ) : colOrders.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 text-center">
                        <span className="material-symbols-outlined text-3xl text-outline opacity-30">{col.icon}</span>
                        <p className="font-body text-xs text-on-surface-variant mt-2 opacity-50">No orders here</p>
                      </div>
                    ) : (
                      colOrders.slice(0, visibleCounts[col.key]).map(order => (
                        <motion.div
                          key={order.id}
                          initial={{ opacity: 0, y: 5 }}
                          animate={{ opacity: 1, y: 0 }}
                        >
                          <OrderCard order={order} onAccept={handleAccept} onReady={handleReady} />
                        </motion.div>
                      ))
                    )}
                  </div>
                  {!loading && colOrders.length > visibleCounts[col.key] && (
                    <button 
                      onClick={() => setVisibleCounts(prev => ({ ...prev, [col.key]: prev[col.key] + 10 }))}
                      className="w-full h-10 mt-3 rounded-xl border border-outline-variant/20 bg-surface-container-highest text-on-surface hover:bg-surface-container-high font-label text-[9px] uppercase tracking-widest transition-colors"
                    >
                      Load More
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
