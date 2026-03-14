import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import api from '../api';
import { motion, AnimatePresence } from 'framer-motion';
import RippleButton from '../components/RippleButton';
import { Package, MapPin, Flag, Bike, ChevronRight } from 'lucide-react';

const Icons = {
  box:  <Package className="w-6 h-6" strokeWidth={1.5} />,
  map:  <MapPin className="w-6 h-6" strokeWidth={1.5} />,
  flag: <Flag className="w-6 h-6" strokeWidth={1.5} />,
  bike: <Bike className="w-6 h-6" strokeWidth={1.5} />,
  chevron: <ChevronRight className="w-4 h-4" strokeWidth={2} />,
};

const RiderDashboard = () => {
  const [availableOrders, setAvailableOrders] = useState([]);
  const [activeDelivery, setActiveDelivery]   = useState(null);
  const [loading, setLoading]                 = useState(true);
  const [secureCodeInput, setSecureCodeInput] = useState('');
  const [confirming, setConfirming]           = useState(false);
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
    } catch { /* silent */ } finally { setLoading(false); }
  };

  const handleAccept = async (orderId) => {
    try {
      await api.post(`/rider/accept/${orderId}`, { riderId: user?.id || 'unknown' });
      const order = availableOrders.find(o => o.id === orderId);
      setActiveDelivery({ ...order, status: 'PICKED_UP' });
      setAvailableOrders(availableOrders.filter(o => o.id !== orderId));
      toast.success('Delivery assigned to you.');
    } catch { toast.error('Could not accept delivery.'); }
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
    } catch { toast.error('Invalid confirmation code.'); } finally { setConfirming(false); }
  };

  return (
    <div className="min-h-dvh pb-28 lg:pb-0 font-sans bg-[#F8F7F6]">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}
        className="px-4 pt-6 lg:px-10 lg:pt-10 max-w-5xl mx-auto"
      >
        {/* ── Header ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 bg-white p-6 rounded-2xl border border-[#E8E6E3] shadow-card-sm">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-[#D97706] bg-[#FEF3C7]">
              {Icons.bike}
            </div>
            <div>
              <p className="section-label mb-0.5">Fleet Command</p>
              <h1 className="text-2xl font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
                {user?.nickname || 'Rider'}
              </h1>
              <p className="text-[11px] text-[#D97706] font-bold flex items-center gap-1.5 mt-1 uppercase tracking-wider">
                <span className="w-2 h-2 rounded-full bg-[#D97706]" /> Live Tracking Active
              </p>
            </div>
          </div>
          <div className="text-right hidden sm:block">
            <p className="section-label mb-1">Authenticated Node</p>
            <p className="text-sm font-bold text-[#18181B] bg-[#F4F4F5] px-3 py-1.5 rounded-lg uppercase">{user?.publicId || 'Verifying…'}</p>
          </div>
        </div>

        {/* ── Active Delivery ── */}
        <AnimatePresence>
          {activeDelivery && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="mb-8 p-6 bg-white rounded-2xl border border-[#059669] shadow-[0_4px_24px_-4px_rgba(5,150,105,0.15)]"
            >
              <h2 className="section-label !text-[#059669] !font-bold flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
                Active Route
              </h2>

              <div className="grid lg:grid-cols-2 gap-8">
                {/* Route info */}
                <div className="space-y-4 relative">
                  <div className="absolute left-[24px] top-12 bottom-12 w-px border-l-2 border-dashed border-[#E8E6E3]" />
                  <div className="flex gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#18181B] shrink-0 border-2 border-white bg-[#F4F4F5]">
                      {Icons.map}
                    </div>
                    <div>
                      <p className="section-label mb-1">Origin</p>
                      <p className="font-bold text-[#18181B] leading-relaxed max-w-[280px]">{activeDelivery.pickupLocation || 'Pharmacy Depot'}</p>
                    </div>
                  </div>
                  <div className="flex gap-4 relative z-10">
                    <div className="w-12 h-12 rounded-full flex items-center justify-center text-[#059669] shrink-0 bg-[#D1FAE5] border-2 border-white">
                      {Icons.flag}
                    </div>
                    <div>
                      <p className="section-label mb-1">Destination</p>
                      <p className="font-bold text-[#18181B] leading-relaxed max-w-[280px]">{activeDelivery.deliveryAddress || 'Client Location'}</p>
                    </div>
                  </div>
                </div>

                {/* Verification code */}
                <div className="p-6 rounded-2xl flex flex-col justify-center bg-[#F9F9FB] border border-[#E8E6E3]">
                  <p className="section-label text-center border-b border-[#F0EDED] pb-4 mb-4">
                    Recipient Verification Code
                  </p>
                  <div className="flex flex-col gap-4">
                    <input
                      type="text"
                      maxLength={4}
                      value={secureCodeInput}
                      onChange={(e) => setSecureCodeInput(e.target.value.replace(/\D/g, ''))}
                      className="w-full text-center text-4xl font-black rounded-xl border border-[#E8E6E3] bg-white transition-colors"
                      placeholder="0000"
                      style={{
                        color: '#059669',
                        letterSpacing: '0.4em',
                        padding: '16px',
                        outline: 'none'
                      }}
                      onFocus={e => e.target.style.borderColor = '#059669'}
                      onBlur={e => e.target.style.borderColor = '#E8E6E3'}
                    />
                    <RippleButton
                      onClick={handleDeliver}
                      disabled={confirming || secureCodeInput.length < 4}
                      variant="primary"
                      size="lg"
                      className="justify-center"
                    >
                      {confirming ? 'Verifying…' : 'Confirm Delivery'}
                    </RippleButton>
                  </div>
                  <p className="text-[12px] text-[#A1A1AA] text-center mt-4">
                    Enter the client's 4-digit code to conclude the trip.
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Available Orders ── */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-label">Available Deliveries</h2>
          {availableOrders.length > 0 && (
            <span className="text-[11px] font-bold text-[#18181B] bg-[#E8E6E3] px-3 py-1 rounded-full">
              {availableOrders.length} route{availableOrders.length !== 1 ? 's' : ''}
            </span>
          )}
        </div>

        {loading ? (
          <div className="space-y-4">
            {[1,2,3].map(i => <div key={i} className="h-24 rounded-2xl bg-[#E8E6E3] animate-pulse" />)}
          </div>
        ) : availableOrders.length === 0 ? (
          <div className="py-20 rounded-2xl bg-white border border-dashed border-[#E8E6E3] flex flex-col items-center justify-center text-center">
            <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 text-[#D97706] bg-[#FEF3C7]">
              {Icons.bike}
            </div>
            <p className="section-label">No routes available right now</p>
          </div>
        ) : (
          <div className="space-y-4 pb-12">
            {availableOrders.map((order) => (
              <div key={order.id}
                className={`p-5 rounded-2xl bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-5 transition-all border border-[#E8E6E3] shadow-card-sm hover:border-[#D4D4D8] ${activeDelivery ? 'opacity-40 pointer-events-none grayscale' : ''}`}
              >
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 text-[#18181B] bg-[#F4F4F5]">
                    {Icons.box}
                  </div>
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                       <p className="section-label">Order ID: <span className="text-[#18181B]">{order.publicOrderId}</span></p>
                    </div>
                    <p className="text-[14px] font-bold text-[#18181B] flex items-center gap-2 mt-1 line-clamp-2">
                       <span className="text-[#A1A1AA]">{Icons.flag}</span>
                       {order.deliveryAddress}
                    </p>
                  </div>
                </div>
                <RippleButton variant="amber" onClick={() => handleAccept(order.id)} disabled={!!activeDelivery}>
                  Accept Route
                </RippleButton>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default RiderDashboard;
