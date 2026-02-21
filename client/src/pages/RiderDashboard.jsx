import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import EmptyState from '../components/EmptyState';
import api from '../api';
import { motion } from 'framer-motion';
import RippleButton from '../components/RippleButton';

/* ─── SVG Icons ─── */
const Icons = {
  box: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 3.75h3M12 15.75h3M12 7.5v4.75" /></svg>,
  map: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" /></svg>,
  flag: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5" /></svg>,
  bike: <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}><path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5h3m-6.75 2.25h10.5a2.25 2.25 0 002.25-2.25v-15a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 4.5v15a2.25 2.25 0 002.25 2.25z" /></svg>, // Abstract icon used for empty state
};

const RiderDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeDelivery, setActiveDelivery] = useState(null);
  const [loading, setLoading] = useState(true);
  const [secureCodeInput, setSecureCodeInput] = useState('');
  const [confirming, setConfirming] = useState(false);
  const { user } = useAuth();
  const toast = useToast();

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchOrders = async () => {
    try {
      const res = await api.get('/rider/available');
      setAvailableOrders(res.data.data || []);
    } catch {
      console.error('Error fetching orders');
    } finally {
      setLoading(false);
    }
  };

  const handleAccept = async (orderId) => {
    try {
      await api.post(`/rider/accept/${orderId}`, { riderId: user?.id || 'unknown' });
      const order = availableOrders.find(o => o.id === orderId);
      setActiveDelivery({ ...order, status: 'PICKED_UP' });
      setAvailableOrders(availableOrders.filter(o => o.id !== orderId));
      toast.success('Delivery accepted.');
    } catch {
      toast.error('Could not accept.');
    }
  };

  const handleDeliver = async () => {
    if (!activeDelivery || !secureCodeInput.trim()) return;
    setConfirming(true);
    try {
      const res = await api.post(`/rider/deliver/${activeDelivery.id}`, { code: secureCodeInput });
      if (res.data) {
        toast.success('Confirmed. Delivery complete.');
        setActiveDelivery(null);
        setSecureCodeInput('');
        fetchOrders();
      }
    } catch {
      toast.error('Invalid code.');
    } finally {
      setConfirming(false);
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="p-6 lg:p-8 max-w-4xl mx-auto relative z-10"
    >
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-text-primary">Logistics</h1>
          <p className="text-sm text-text-muted mt-1">Blind delivery system</p>
        </div>
        <div className="glass-card px-4 py-2 border border-white/10">
          <p className="text-[10px] text-text-dim uppercase tracking-wider">Rider</p>
          <p className="font-mono font-bold text-sm text-action">{user?.publicId || 'N/A'}</p>
        </div>
      </div>

      {/* Active Delivery Card */}
      {activeDelivery && (
        <div className="glass-card p-6 border-l-4 border-l-amber-400 mb-8 animate-scale-in relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <div className="text-9xl text-amber-400 rotate-12">{Icons.box}</div>
          </div>
          
          <div className="relative z-10">
            <h2 className="text-lg font-bold text-amber-400 mb-6 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Active Delivery
            </h2>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0">
                     {Icons.map}
                   </div>
                   <div>
                     <p className="text-xs text-text-dim uppercase tracking-wider mb-1">Pickup From</p>
                     <p className="font-medium text-text-primary">{activeDelivery.pickupLocation}</p>
                   </div>
                </div>
                
                <div className="pl-5 -my-4 border-l border-dashed border-white/10 h-8" />

                <div className="flex gap-4">
                   <div className="w-10 h-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                     {Icons.flag}
                   </div>
                   <div>
                     <p className="text-xs text-text-dim uppercase tracking-wider mb-1">Deliver To</p>
                     <p className="font-medium text-text-primary">{activeDelivery.deliveryAddress}</p>
                   </div>
                </div>
              </div>

              <div className="bg-surface/50 rounded-xl p-5 border border-white/5">
                <label className="text-xs text-text-muted block mb-3">Recipient Secure Code</label>
                <div className="flex gap-2">
                   <input
                     type="text"
                     maxLength={4}
                     value={secureCodeInput}
                     onChange={(e) => setSecureCodeInput(e.target.value)}
                     className="input-field text-center font-mono text-xl tracking-[0.5em] flex-1"
                     placeholder="0000"
                   />
                   <RippleButton 
                     onClick={handleDeliver}
                     disabled={confirming || secureCodeInput.length < 4}
                     className="px-6 justify-center"
                   >
                     {confirming ? '...' : 'Verify'}
                   </RippleButton>
                </div>
                <p className="text-[10px] text-text-dim mt-2">
                  Ask recipient for their 4-digit code to complete delivery.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Available LIST */}
      <h2 className="section-title">Available Assignments</h2>
      {loading ? (
        <div className="space-y-3">
          {[1,2].map(i => <div key={i} className="h-20 bg-surface rounded-xl animate-pulse" />)}
        </div>
      ) : availableOrders.length === 0 ? (
        <EmptyState
          svgIcon={Icons.box}
          title="No deliveries"
          description="Waiting for pharmacies to mark orders as ready."
        />
      ) : (
        <div className="space-y-3">
          {availableOrders.map((order, i) => (
            <div key={order.id} className="glass-card p-5 flex items-center justify-between animate-slide-up hover:bg-surface-alt transition" style={{ animationDelay: `${i*0.05}s` }}>
              <div className="flex items-center gap-4">
                 <div className="w-12 h-12 rounded-xl bg-surface border border-white/5 flex items-center justify-center text-text-dim">
                   {Icons.box}
                 </div>
                 <div>
                   <p className="font-mono text-sm font-bold text-text-primary">{order.publicOrderId}</p>
                   <p className="text-xs text-text-muted mt-0.5">{order.deliveryAddress}</p>
                 </div>
              </div>
              <RippleButton
                onClick={() => handleAccept(order.id)}
                disabled={!!activeDelivery}
                className={`text-xs justify-center ${activeDelivery ? 'opacity-50 grayscale' : ''}`}
                variant={activeDelivery ? 'secondary' : 'primary'}
              >
                {activeDelivery ? 'Finish Active Job' : 'Accept Job'}
              </RippleButton>
            </div>
          ))}
        </div>
      )}
    </motion.div>
  );
};

export default RiderDashboard;
