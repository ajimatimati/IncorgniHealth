import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import api from '../api';

function DeliveryCard({ order, onPickup, onDeliver }) {
  const meds = Array.isArray(order.prescription?.medications) ? order.prescription.medications : [];
  const date = new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });

  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-headline text-sm font-semibold text-on-surface">
            #{order.publicOrderId || order.id?.slice(-6).toUpperCase()}
          </p>
          <p className="font-label text-[10px] text-outline uppercase tracking-wide mt-0.5">
            Pt. {order.patient?.publicId || '—'} · {date}
          </p>
        </div>
        <span className={`font-label text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full ${
          order.status === 'PICKED_UP' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'
        }`}>
          {order.status?.replace('_', ' ').toLowerCase()}
        </span>
      </div>

      {meds.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {meds.slice(0, 3).map((m, i) => (
            <span key={i} className="font-body text-[10px] text-on-surface-variant px-2 py-0.5 rounded-full bg-surface-container-high">
              {typeof m === 'string' ? m : m.name || '—'}
            </span>
          ))}
        </div>
      )}

      {order.status === 'READY_FOR_PICKUP' && (
        <button
          onClick={() => onPickup(order.id)}
          className="w-full py-2.5 rounded-xl bg-primary text-on-primary font-label text-[11px] uppercase tracking-widest hover:brightness-110 transition-all"
        >
          Pick Up Order
        </button>
      )}
      {order.status === 'PICKED_UP' && (
        <div className="space-y-2">
          <p className="font-label text-[10px] text-outline uppercase tracking-wide">Enter patient secure code to deliver</p>
          <DeliverForm orderId={order.id} onDeliver={onDeliver} />
        </div>
      )}
    </div>
  );
}

function DeliverForm({ orderId, onDeliver }) {
  const [code, setCode] = useState('');
  return (
    <div className="flex gap-2">
      <input
        type="text" maxLength={4} value={code}
        onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
        placeholder="0000"
        className="flex-1 bg-surface-container-high border border-outline-variant/10 rounded-xl px-3 py-2 text-center text-on-surface font-headline tracking-[0.4em] text-lg outline-none focus:border-primary transition-all"
      />
      <button
        onClick={() => onDeliver(orderId, code)}
        disabled={code.length < 4}
        className="px-4 py-2 rounded-xl bg-tertiary text-background font-label text-[11px] uppercase tracking-widest disabled:opacity-40 hover:brightness-110 transition-all"
      >
        Deliver
      </button>
    </div>
  );
}

export default function RiderDashboard() {
  const [available, setAvailable]     = useState([]);
  const [myDeliveries, setMyDeliveries] = useState([]);
  const [loading, setLoading]         = useState(true);
  const [tab, setTab]                 = useState('available');

  const fetchData = useCallback(async () => {
    try {
      const [avRes, myRes] = await Promise.all([
        api.get('/rider/available'),
        api.get('/rider/my-deliveries'),
      ]);
      setAvailable(Array.isArray(avRes.data) ? avRes.data : []);
      setMyDeliveries(Array.isArray(myRes.data) ? myRes.data : []);
    } catch (err) {
      console.error('Rider fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 30_000);
    return () => clearInterval(iv);
  }, [fetchData]);

  const handlePickup = async (id) => {
    try { await api.put(`/rider/pickup/${id}`); fetchData(); }
    catch (err) { console.error(err); }
  };

  const handleDeliver = async (id, code) => {
    try { await api.put(`/rider/deliver/${id}`, { secureCode: code }); fetchData(); }
    catch (err) { console.error(err); }
  };

  const showOrders = tab === 'available' ? available : myDeliveries;

  return (
    <div className="relative w-full h-full bg-surface-container-lowest overflow-hidden flex flex-col lg:flex-row">
      
      {/* ── Background Map Simulation ── */}
      <div className="absolute inset-0 z-0 bg-surface-container-lowest overflow-hidden flex items-center justify-center">
        {/* Mock Map Grid */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:48px_48px]"></div>
        <div className="absolute inset-0 bg-[radial-gradient(circle_800px_at_100%_50%,rgba(208,188,255,0.05),transparent)]"></div>
        {/* Soft fade for the left panel on desktop */}
        <div className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-background via-background/80 to-transparent z-0 hidden lg:block"></div>
        
        {/* Mock Map Pins */}
        <div className="absolute top-1/3 right-1/4 w-3 h-3 bg-primary rounded-full shadow-[0_0_20px_rgba(208,188,255,0.8)] hidden lg:block"></div>
        <div className="absolute bottom-1/3 right-1/3 w-3 h-3 bg-tertiary rounded-full shadow-[0_0_15px_rgba(255,180,171,0.6)] hidden lg:block"></div>
        
        <div className="relative z-0 text-outline-variant/40 font-headline font-bold text-4xl lg:text-7xl opacity-50 select-none pointer-events-none text-center">
          <span className="material-symbols-outlined text-[80px] lg:text-[120px] mb-4 opacity-50 block">map</span>
          System Routing Online
        </div>
      </div>

      {/* ── Foreground Command Panel ── */}
      <aside className="relative z-10 w-full lg:w-[460px] h-full flex flex-col bg-surface-container-low/95 lg:backdrop-blur-2xl border-r border-outline-variant/10 shadow-2xl lg:shadow-[20px_0_40px_rgba(0,0,0,0.5)]">
        
        {/* Header Block */}
        <div className="p-6 lg:p-8 flex-shrink-0 border-b border-outline-variant/10">
          <header className="mb-6 flex items-start justify-between">
            <div>
              <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
                Live Routing Protocol
              </p>
              <h1 className="font-headline text-2xl lg:text-3xl font-bold text-on-surface mt-1">Logistics Terminal</h1>
            </div>
            <div className="w-10 h-10 rounded-full bg-surface-container-high flex items-center justify-center border border-outline-variant/10 shadow-inner">
               <span className="material-symbols-outlined text-outline">satellite_alt</span>
            </div>
          </header>

          {/* Tab toggle */}
          <div className="flex gap-2 p-1.5 bg-surface-container border border-outline-variant/10 rounded-xl">
            {['available', 'my-deliveries'].map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg font-label text-[10px] uppercase tracking-widest transition-all ${
                  tab === t 
                    ? 'bg-primary text-on-primary shadow-lg shadow-primary/20' 
                    : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container-highest/50'
                }`}
              >
                {t === 'available' ? 'Available Drops' : 'Active Manifest'}
                {t === 'available' && available.length > 0 && (
                  <span className="ml-2 inline-flex items-center justify-center bg-error text-on-error rounded-full w-4 h-4 text-[9px] font-bold">
                    {available.length}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Deliveries List */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-gradient-to-b from-transparent to-background/50 custom-scrollbar pb-32 lg:pb-8">
          {loading ? (
            <div className="space-y-4">
              {[1,2,3].map(i => <div key={i} className="h-40 rounded-2xl bg-surface-container-high/50 border border-outline-variant/5" />)}
            </div>
          ) : showOrders.length === 0 ? (
            <div className="text-center py-20 bg-surface-container border border-outline-variant/5 rounded-3xl">
              <span className="material-symbols-outlined text-4xl text-outline opacity-40">two_wheeler</span>
              <p className="font-body text-sm text-on-surface-variant mt-4 opacity-70">
                {tab === 'available' ? 'Grid is clear. No pending dispatches.' : 'No active deliveries assigned.'}
              </p>
            </div>
          ) : (
            <div className="space-y-5">
              {showOrders.map(order => (
                <motion.div key={order.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 25 }}>
                  <DeliveryCard order={order} onPickup={handlePickup} onDeliver={handleDeliver} />
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </aside>

      {/* ── Mobile Map Preview Area (Visible only on small screens below the aside) ── */}
      {/* On mobile, we might want the aside to take full screen or map to take full. 
          For now, aside is h-full. The map acts as a background in both, so we are fine. */}
    </div>
  );
}
