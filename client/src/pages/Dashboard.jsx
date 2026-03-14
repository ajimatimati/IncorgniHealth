import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import AvatarGenerator from '../components/AvatarGenerator';
import RippleButton from '../components/RippleButton';
import PaymentModal from '../components/PaymentModal';
import { motion, AnimatePresence } from 'framer-motion';
import { Stethoscope, Pill, Shield, Heart, Brain, Truck, Box, Plus, CheckCircle2 } from 'lucide-react';
import api from '../api';

const ORDER_STEPS  = ['AWAITING_SOURCE', 'PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'DELIVERED'];
const STEP_LABELS  = ['Action Needed', 'Ordered', 'Preparing', 'Ready', 'Delivered'];

/* ── Health score ─────────────────────────────────────────────── */
function calcHealthScore(user, consultations, orders) {
  let score = 0; const factors = [];

  // 1. Adherence to follow up (Max 50)
  let adherenceScore = 50;
  if (orders.length > 0) {
    const delivered = orders.filter(o => o.status === 'DELIVERED').length;
    adherenceScore = Math.round((delivered / orders.length) * 50);
  }
  score += adherenceScore;
  factors.push({ label: 'Adherence to follow up', pts: adherenceScore, max: 50 });

  // 2. Circle of consultations completed (Max 50)
  let consultScore = 50;
  if (consultations.length > 0) {
    const completed = consultations.filter(c => c.status === 'COMPLETED').length;
    consultScore = Math.round((completed / consultations.length) * 50);
  }
  score += consultScore;
  factors.push({ label: 'Circle of consultations completed', pts: consultScore, max: 50 });

  return { score: Math.min(score, 100), factors };
}

function getScoreColour(score) {
  if (score >= 80) return { fill: '#059669', bg: '#D1FAE5', label: 'Excellent' };
  if (score >= 60) return { fill: '#6D28D9', bg: '#EDE9FE', label: 'Good'      };
  if (score >= 40) return { fill: '#D97706', bg: '#FEF3C7', label: 'Fair'      };
  return               { fill: '#DC2626', bg: '#FEE2E2', label: 'Low'       };
}

/* ── Clean health ring ────────────────────────────────────────── */
function HealthRing({ score, factors }) {
  const colour = getScoreColour(score);
  const r = 44, circum = 2 * Math.PI * r;
  const offset = circum - (score / 100) * circum;

  return (
    <div className="bg-white rounded-2xl p-5 shadow-card flex flex-col items-center gap-4">
      <p className="section-label self-start">Health Score</p>
      <div className="relative w-28 h-28">
        <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
          <circle cx="50" cy="50" r={r} fill="none" stroke="#F4F4F5" strokeWidth="8" />
          <motion.circle
            cx="50" cy="50" r={r}
            fill="none" stroke={colour.fill} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circum}
            initial={{ strokeDashoffset: circum }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1], delay: 0.2 }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black text-[#18181B] tabular-nums">{score}</span>
          <span className="text-[10px] text-[#A1A1AA]">/100</span>
        </div>
      </div>
      <span className="text-xs font-semibold px-3 py-1 rounded-full" style={{ background: colour.bg, color: colour.fill }}>
        {colour.label}
      </span>
      <div className="w-full space-y-4 mt-2">
        {factors.map(f => (
          <div key={f.label} className="flex flex-col gap-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-[#71717A] uppercase tracking-wider">{f.label}</span>
              <span className="text-[11px] font-bold text-[#18181B] tabular-nums">{f.pts}/{f.max}</span>
            </div>
            <div className="w-full h-2 rounded-full bg-[#F4F4F5] overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ background: colour.fill }}
                initial={{ width: 0 }}
                animate={{ width: `${Math.round((f.pts / f.max) * 100)}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.4 }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ── Service icons ────────────────────────────────────────────── */
const SERVICE_ICONS = {
  stethoscope: <Stethoscope className="w-5 h-5 shrink-0" strokeWidth={1.75} />,
  pill:        <Pill className="w-5 h-5 shrink-0" strokeWidth={1.75} />,
  shield:      <Shield className="w-5 h-5 shrink-0" strokeWidth={1.75} />,
  heart:       <Heart className="w-5 h-5 shrink-0" strokeWidth={1.75} />,
  brain:       <Brain className="w-5 h-5 shrink-0" strokeWidth={1.75} />,
  ambulance:   <Truck className="w-5 h-5 shrink-0" strokeWidth={1.75} />,
};

/* ── Empty icon shorthand ─────────────────────────────────────── */
const EMPTY_ICON = <Box className="w-8 h-8 shrink-0 opacity-50 text-[#A1A1AA]" strokeWidth={1.5} />;

/* ── Service cards config ─────────────────────────────────────── */
const SERVICE_COLOURS = [
  { icon: '#6D28D9', bg: '#EDE9FE' },  // Consult — violet
  { icon: '#059669', bg: '#D1FAE5' },  // Pharmacy — green
  { icon: '#0284C7', bg: '#E0F2FE' },  // Safe Haven — blue
  { icon: '#DB2777', bg: '#FCE7F3' },  // Sexual Health — pink
  { icon: '#D97706', bg: '#FEF3C7' },  // Wellness — amber
  { icon: '#DC2626', bg: '#FEE2E2' },  // Ambulance — red
];

/* ── Main component ───────────────────────────────────────────── */
const Dashboard = () => {
  const [orders, setOrders]             = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading]           = useState(true);
  const [showTopUp, setShowTopUp]       = useState(false);

  const { user } = useAuth();
  const navigate = useNavigate();
  const toast    = useToast();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const results = await Promise.allSettled([
          api.get('/user/orders'),
          api.get('/user/profile'),
          api.get('/user/consultations'),
        ]);
        if (results[0].status === 'fulfilled') setOrders(results[0].value.data.data || []);
        if (results[1].status === 'fulfilled') setWalletBalance(results[1].value.data.walletBalance);
        if (results[2].status === 'fulfilled') setConsultations(results[2].value.data.data || []);
      } catch {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const handleStartConsultation = async () => {
    // Navigates directly to the directory so the client can select a doctor or schedule
    navigate('/directory');
  };

  const handleSourceSelect = async (orderId, source) => {
    try {
      await api.post(`/user/order/${orderId}/source`, { source });
      toast.success(source === 'IN_HOUSE' ? 'Order sent to In-House Pharmacy' : 'Prescription marked as externally sourced');
      // refresh orders
      const res = await api.get('/user/orders');
      setOrders(res.data.data || []);
    } catch (err) {
      toast.error('Failed to update sourcing choice.');
    }
  };

  const services = [
    { label: 'Consult',       desc: 'See a doctor',    icon: SERVICE_ICONS.stethoscope, action: handleStartConsultation },
    { label: 'Pharmacy',      desc: 'Order medication', icon: SERVICE_ICONS.pill,        action: () => toast.info('Start a consultation to order medication.') },
    { label: 'Safe Haven',    desc: 'Private space',    icon: SERVICE_ICONS.shield,      action: () => navigate('/safe-haven') },
    { label: 'Sexual Health', desc: 'Discreet care',    icon: SERVICE_ICONS.heart,       action: () => navigate('/sexual-health') },
    { label: 'Wellness',      desc: 'Mental health',    icon: SERVICE_ICONS.brain,       action: () => navigate('/mental-wellness') },
    { label: 'Ambulance',     desc: 'Emergency 112',   icon: SERVICE_ICONS.ambulance,   action: () => { window.location.href = 'tel:112'; } },
  ];

  const activeOrders    = orders.filter(o => o.status !== 'DELIVERED' && o.status !== 'SOURCED_ELSEWHERE');
  const recentConsults  = consultations.slice(0, 5);
  const { score: healthScore, factors: healthFactors } = useMemo(
    () => calcHealthScore(user, consultations, orders),
    [user, consultations, orders]
  );

  const greetHour = new Date().getHours();
  const greet = greetHour < 12 ? 'Good morning' : greetHour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-dvh bg-[#F8F7F6] pb-28 lg:pb-10 px-4 pt-6 lg:px-8 lg:pt-10 max-w-4xl mx-auto"
    >
      {/* ── Greeting ── */}
      <div className="mb-8">
        <p className="text-sm text-[#A1A1AA] mb-1">{greet}</p>
        <h1 className="text-3xl font-black text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
          {user?.nickname || 'Client'}
        </h1>
        <p className="text-sm text-[#71717A] mt-1">Your personal health hub.</p>
      </div>

      {/* ── Summary row: wallet + stats ── */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {/* Wallet */}
        <div className="col-span-2 bg-white rounded-2xl p-5 shadow-card flex items-center justify-between">
          <div>
            <p className="section-label mb-1">Wallet Balance</p>
            <p className="text-2xl font-black text-[#18181B] tabular-nums">
              ₦{walletBalance !== null ? walletBalance.toLocaleString() : '—'}
            </p>
          </div>
          <RippleButton onClick={() => setShowTopUp(true)} size="sm" variant="violet">
            <Plus className="w-4 h-4" strokeWidth={2.5} />
            Add funds
          </RippleButton>
        </div>

        {/* Consults stat */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <p className="text-2xl font-black text-[#18181B] tabular-nums">{consultations.length}</p>
          <p className="section-label mt-1">Consultations</p>
        </div>

        {/* Active orders stat */}
        <div className="bg-white rounded-2xl p-4 shadow-card">
          <p className="text-2xl font-black text-[#18181B] tabular-nums">{activeOrders.length}</p>
          <p className="section-label mt-1">Active Orders</p>
        </div>
      </div>

      {/* ── Health score ring ── */}
      <div className="mb-8">
        <HealthRing score={healthScore} factors={healthFactors} />
      </div>

      {/* ── Services ── */}
      <div className="mb-8">
        <p className="section-label mb-4">Services</p>
        <div className="grid grid-cols-3 gap-3">
          {services.map((s, i) => (
            <motion.button
              key={i} type="button"
              onClick={s.action}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05, duration: 0.3 }}
              whileTap={{ scale: 0.96 }}
              className="bg-white rounded-2xl p-4 flex flex-col items-center text-center gap-3 shadow-card hover:shadow-card-md transition-shadow duration-200"
            >
              <div
                className="w-11 h-11 rounded-xl flex items-center justify-center"
                style={{ background: SERVICE_COLOURS[i].bg, color: SERVICE_COLOURS[i].icon }}
              >
                {s.icon}
              </div>
              <div>
                <p className="text-[13px] font-semibold text-[#18181B] leading-tight">{s.label}</p>
                <p className="text-[11px] text-[#A1A1AA] leading-tight mt-0.5 hidden sm:block">{s.desc}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* ── Active deliveries ── */}
      <div className="mb-8">
        <p className="section-label mb-4">Active Deliveries</p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="skeleton h-24 rounded-2xl" />)}
          </div>
        ) : activeOrders.length > 0 ? (
          <div className="space-y-3">
            {activeOrders.map(order => {
              const currentStep = ORDER_STEPS.indexOf(order.status);
              return (
                <div key={order.id} className="bg-white rounded-2xl p-5 shadow-card">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <p className="section-label mb-0.5">Order</p>
                      <p className="font-bold text-[#18181B]">{order.publicOrderId}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>
                  {/* Progress track */}
                  <div className="flex gap-1 mb-2">
                    {ORDER_STEPS.map((_, idx) => (
                      <div key={idx} className={`h-1.5 flex-1 rounded-full transition-all ${idx <= currentStep ? 'bg-[#6D28D9]' : 'bg-[#F4F4F5]'}`} />
                    ))}
                  </div>
                  <div className="flex justify-between">
                    {STEP_LABELS.map((label, idx) => (
                      <span key={label} className={`text-[10px] font-medium ${idx === currentStep ? 'text-[#6D28D9]' : 'text-[#A1A1AA]'}`}>
                        {label}
                      </span>
                    ))}
                  </div>

                  {order.status === 'AWAITING_SOURCE' && (
                    <div className="mt-4 pt-4 border-t border-[#F0EDED]">
                       <p className="text-[12px] font-bold text-[#18181B] mb-3 text-center">A new prescription requires sourcing. Would you like to use our in-house pharmacy?</p>
                       <div className="flex gap-2 justify-center">
                         <RippleButton size="sm" onClick={() => handleSourceSelect(order.id, 'IN_HOUSE')} variant="violet">
                           Buy from Facility
                         </RippleButton>
                         <RippleButton size="sm" onClick={() => handleSourceSelect(order.id, 'EXTERNAL')} variant="outline">
                           Source Elsewhere
                         </RippleButton>
                       </div>
                    </div>
                  )}

                  {order.secureCode && order.status !== 'AWAITING_SOURCE' && (
                    <div className="mt-4 pt-4 border-t border-[#F0EDED] flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-[#D1FAE5] flex items-center justify-center">
                        <CheckCircle2 className="w-4 h-4 text-[#059669]" strokeWidth={2} />
                      </div>
                      <div>
                        <p className="section-label">Delivery Code</p>
                        <p className="text-xl font-black text-[#18181B] tabular-nums tracking-widest">{order.secureCode}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState icon={EMPTY_ICON} message="No active deliveries" />
        )}
      </div>

      {/* ── Recent consultations ── */}
      <div className="mb-8">
        <p className="section-label mb-4">Recent Consultations</p>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <div key={i} className="skeleton h-16 rounded-2xl" />)}
          </div>
        ) : recentConsults.length === 0 ? (
          <EmptyState icon={SERVICE_ICONS.stethoscope} message="No recent consultations" />
        ) : (
          <div className="space-y-2">
            {recentConsults.map(c => (
              <button key={c.id} type="button" onClick={() => navigate(`/chat/${c.id}`)}
                className="w-full bg-white rounded-2xl p-4 flex items-center gap-4 text-left shadow-card hover:shadow-card-md transition-shadow"
              >
                <AvatarGenerator seed={c.doctor?.publicId || c.id} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-[#18181B] text-sm truncate">{c.doctor?.publicId || 'Pending Doctor'}</p>
                  <p className="text-xs text-[#A1A1AA]">{c._count?.messages || 0} messages</p>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <StatusBadge status={c.status} />
                  <p className="text-[11px] text-[#A1A1AA]">
                    {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Payment modal ── */}
      <AnimatePresence>
        {showTopUp && (
          <PaymentModal
            amount={0} type="Wallet Top-up"
            payerId={user?.email || user?.publicId}
            onClose={() => setShowTopUp(false)}
            onSuccess={data => setWalletBalance(prev => (prev || 0) + Number(data.amount))}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;
