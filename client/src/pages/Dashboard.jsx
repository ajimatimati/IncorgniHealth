import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
// eslint-disable-next-line no-unused-vars
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import api from '../api';
import DiagnosticOverview from '../components/DiagnosticOverview';

// Deterministic mock vitals generator based on patient ID
function getMockVitals(publicId) {
  if (!publicId) return {
    heartRate:     72,
    bloodPressure: '120/80',
    weight:        '75kg',
    height:        '180cm',
    bmi:           '23.1',
    temperature:   '36.8°C',
    oxygen:        '98%',
    status:        'Optimal',
  };
  let hash = 0;
  for (let i = 0; i < publicId.length; i++) {
    hash = publicId.charCodeAt(i) + ((hash << 5) - hash);
  }
  const heartRate = 60 + Math.abs(hash % 30);
  const bpSys = 110 + Math.abs((hash >> 2) % 25);
  const bpDia = 70 + Math.abs((hash >> 4) % 15);
  const temp = (36.2 + Math.abs((hash >> 6) % 12) / 10).toFixed(1);
  const oxygen = 95 + Math.abs((hash >> 8) % 5);
  const bmi = (20.5 + Math.abs((hash >> 10) % 70) / 10).toFixed(1);
  
  return {
    heartRate,
    bloodPressure: `${bpSys}/${bpDia}`,
    weight: `${70 + Math.abs((hash >> 12) % 20)}kg`,
    height: `${170 + Math.abs((hash >> 14) % 20)}cm`,
    bmi,
    temperature: `${temp}°C`,
    oxygen: `${oxygen}%`,
    status: heartRate > 85 || bpSys > 130 ? 'Caution' : 'Optimal',
  };
}

// ── Greeting helper ─────────────────────────────────────────────────────────
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// ── Stat card ────────────────────────────────────────────────────────────────
function StatCard({ icon, label, value, sub, color = 'text-primary' }) {
  return (
    <div className="bg-surface-container-low border border-outline-variant/10 rounded-2xl p-5 flex flex-col gap-3">
      <div className={`w-10 h-10 rounded-xl bg-surface-container-high flex items-center justify-center ${color}`}>
        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
      </div>
      <div>
        <p className="font-headline text-2xl font-bold text-on-surface">{value ?? '—'}</p>
        <p className="font-label text-[11px] text-outline uppercase tracking-widest mt-0.5">{label}</p>
        {sub && <p className="font-body text-xs text-on-surface-variant mt-1 opacity-70">{sub}</p>}
      </div>
    </div>
  );
}

// ── Consultation row ─────────────────────────────────────────────────────────
function ConsultRow({ consult, navigate }) {
  const date = new Date(consult.updatedAt || consult.createdAt);
  const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const statusColor = {
    ACTIVE:    'text-tertiary bg-tertiary/10',
    COMPLETED: 'text-primary bg-primary/10',
    PENDING:   'text-outline bg-surface-container-high',
  }[consult.status] || 'text-outline bg-surface-container-high';

  return (
    <button
      onClick={() => navigate(`/chat/${consult.id}`)}
      className="w-full flex items-center gap-4 p-4 rounded-xl bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high transition-all text-left group"
    >
      <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <span className="material-symbols-outlined text-primary text-base" style={{ fontVariationSettings: "'FILL' 1" }}>stethoscope</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-headline text-sm font-semibold text-on-surface truncate">
          Dr. {consult.doctor?.publicId || 'Assigned Doctor'}
        </p>
        <p className="font-label text-[11px] text-outline mt-0.5 uppercase tracking-wide">{label}</p>
      </div>
      <span className={`font-label text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full ${statusColor}`}>
        {consult.status?.toLowerCase()}
      </span>
      <span className="material-symbols-outlined text-outline group-hover:text-on-surface text-base transition-colors">chevron_right</span>
    </button>
  );
}

// ── Health score ring ────────────────────────────────────────────────────────
function HealthRing({ score = 78 }) {
  const r = 40, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="relative w-28 h-28 mx-auto">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="currentColor" strokeWidth="8" className="text-surface-container-high" />
        <circle
          cx="50" cy="50" r={r} fill="none"
          stroke="url(#ring-grad)" strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={`${dash} ${c}`}
        />
        <defs>
          <linearGradient id="ring-grad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#a078ff" />
            <stop offset="100%" stopColor="#8ccdff" />
          </linearGradient>
        </defs>
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-headline text-2xl font-black text-on-surface">{score}</span>
        <span className="font-label text-[9px] text-outline uppercase tracking-widest">/100</span>
      </div>
    </div>
  );
}

// ── Services bento ────────────────────────────────────────────────────────────
const SERVICES = [
  { icon: 'stethoscope',    label: 'Consult',       to: '/directory',       color: 'text-primary'    },
  { icon: 'medication',     label: 'Pharmacy',      to: '/pharmacy',        color: 'text-tertiary'   },
  { icon: 'shield_with_heart', label: 'Safe Haven', to: '/safe-haven',      color: 'text-error'      },
  { icon: 'diversity_1',    label: 'Coaching',      to: '/coaching',        color: 'text-tertiary'   },
  { icon: 'health_and_safety', label: 'Sexual Health', to: '/sexual-health', color: 'text-secondary' },
  { icon: 'self_improvement',  label: 'Wellness',   to: '/mental-wellness', color: 'text-primary'    },
  { icon: 'local_hospital', label: 'Emergency',     action: () => window.dispatchEvent(new Event('open-sos')), color: 'text-error' },
];

// ─── Main Dashboard ───────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]         = useState(null);
  const [consultations, setConsults]  = useState([]);
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isStealthMode, setIsStealthMode] = useState(() => localStorage.getItem('stealth_mode') === 'true');

  const fetchData = useCallback(async () => {
    try {
      const [profileRes, consultRes, ordersRes] = await Promise.all([
        api.get('/user/profile'),
        api.get('/user/consultations?limit=5'),
        api.get('/user/orders?limit=5'),
      ]);
      setProfile(profileRes.data);
      setConsults(consultRes.data?.data || consultRes.data || []);
      setOrders(ordersRes.data?.data || ordersRes.data || []);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const balance  = profile?.walletBalance ?? 0;

  const toggleStealthMode = () => {
    const nextVal = !isStealthMode;
    setIsStealthMode(nextVal);
    localStorage.setItem('stealth_mode', String(nextVal));
  };

  const getOrderStatusStep = (status) => {
    switch (status) {
      case 'PENDING': return 0;
      case 'PROCESSING': return 1;
      case 'READY_FOR_PICKUP':
      case 'PICKED_UP': return 2;
      case 'DELIVERED': return 3;
      default: return 0;
    }
  };

  const activeOrder = orders.find(o => o.status !== 'DELIVERED');
  const nickname = profile?.nickname || user?.publicId || 'Anonymous';

  return (
    <div className="bg-background min-h-full text-on-background">
      {/* ── Desktop layout: 2-col grid ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-10 py-8 lg:py-10">

        {/* Page header */}
        <header className="mb-8">
          <p className="font-label text-[11px] text-primary uppercase tracking-[0.2em]">{getGreeting()}</p>
          <h1 className="font-headline text-3xl lg:text-4xl font-bold text-on-surface mt-1">
            How are you <span className="text-primary">feeling?</span>
          </h1>
          <p className="font-body text-sm text-on-surface-variant mt-2 opacity-70">
            Your confidential health dashboard.
          </p>
        </header>

        {/* Main Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">

          {/* ── Top Left: Care Vault (Spans 8) ─────────────────────────────── */}
          <div className="md:col-span-12 lg:col-span-8 space-y-6">

            {/* Wallet Balance card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gradient-to-br from-[#1c1b22] to-[#121115] border border-outline-variant/20 rounded-[2rem] p-6 lg:p-8 relative overflow-hidden group shadow-card-md"
            >
              {/* Premium Glow Effects */}
              <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-primary/20 rounded-full blur-[80px] pointer-events-none transition-transform duration-1000 group-hover:scale-110" />
              <div className="absolute bottom-[-20%] left-[-10%] w-[50%] h-[50%] bg-tertiary/15 rounded-full blur-[60px] pointer-events-none" />
              
              <div className="flex flex-col relative z-10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-surface-container-high/50 flex items-center justify-center border border-outline-variant/20">
                      <span className="material-symbols-outlined text-primary text-[16px]">account_balance_wallet</span>
                    </div>
                    <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">Wallet Balance</p>
                  </div>
                  <div className="flex items-center gap-2 bg-surface-container-high/30 backdrop-blur-md px-3 py-1.5 rounded-full border border-outline-variant/10">
                    <div className="w-1.5 h-1.5 rounded-full bg-tertiary shadow-[0_0_8px_rgba(140,205,255,0.8)] animate-pulse" />
                    <p className="font-label text-[9px] text-on-surface-variant uppercase tracking-widest">Available for care</p>
                  </div>
                </div>
                
                <div className="flex items-baseline mt-6 mb-2">
                  <span className="font-headline text-2xl font-medium text-on-surface-variant mr-1.5">₦</span>
                  <p className="font-headline text-5xl font-black text-on-surface tracking-tight">
                    {balance.toLocaleString()}
                  </p>
                </div>
              </div>
              
              <div className="mt-8 relative z-10 flex flex-col sm:flex-row items-center gap-3">
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full sm:flex-1 bg-on-surface text-background font-headline text-sm font-bold py-3.5 px-4 rounded-xl hover:brightness-90 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add Funds
                </button>
                <button
                  onClick={() => navigate('/profile')}
                  className="w-full sm:flex-1 bg-surface-container-highest/60 backdrop-blur-md border border-outline-variant/30 text-on-surface font-headline text-sm font-bold py-3.5 px-4 rounded-xl hover:bg-surface-variant active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[18px]">history</span>
                  History
                </button>
              </div>
            </motion.div>

            {/* Active Delivery Tracking Card */}
            {activeOrder && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-surface-container-low border border-outline-variant/10 rounded-[2rem] p-6 shadow-md relative overflow-hidden"
              >
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                      <span className="material-symbols-outlined">
                        {isStealthMode ? 'restaurant' : 'local_shipping'}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-headline text-base font-bold text-on-surface">
                        {isStealthMode ? 'Jumia Food Order' : 'Discreet Delivery'}
                      </h3>
                      <p className="font-headline text-[11px] font-mono text-outline">
                        {isStealthMode ? '#JF-938217' : activeOrder.publicOrderId}
                      </p>
                    </div>
                  </div>

                  {/* Stealth Toggle Switch */}
                  <button
                    onClick={toggleStealthMode}
                    className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                      isStealthMode
                        ? 'bg-tertiary/10 border-tertiary text-tertiary shadow-[0_0_8px_rgba(140,205,255,0.2)]'
                        : 'bg-surface-container border-outline-variant/35 text-outline hover:text-on-surface'
                    }`}
                  >
                    <span className="material-symbols-outlined text-sm">
                      {isStealthMode ? 'visibility_off' : 'visibility'}
                    </span>
                    <span className="font-label text-[9px] uppercase tracking-wider font-bold">
                      {isStealthMode ? 'Stealth ON' : 'Stealth Off'}
                    </span>
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-outline-variant/5">
                  <div className="space-y-1.5">
                    <p className="font-label text-[9px] text-outline uppercase tracking-widest">
                      {isStealthMode ? 'Items Ordered' : 'Prescription / Contents'}
                    </p>
                    <p className="font-body text-sm font-bold text-on-surface">
                      {isStealthMode ? 'Double Cheeseburger & Fries Combo' : (activeOrder.prescription?.medications?.[0]?.name || 'Medical Supply')}
                    </p>
                    <p className="font-body text-xs text-on-surface-variant opacity-70">
                      {isStealthMode ? 'Burger Bistro, Lekki' : 'Discreet Pharmacy Hub'}
                    </p>
                  </div>

                  <div className="space-y-1.5">
                    <p className="font-label text-[9px] text-outline uppercase tracking-widest">
                      {isStealthMode ? 'Delivery Address' : 'Private Delivery Address'}
                    </p>
                    <p className="font-body text-xs text-on-surface truncate">
                      {isStealthMode ? '12, Joel Ogunnaike St, Ikeja' : (activeOrder.deliveryAddress || 'Secure Handover Point')}
                    </p>
                    {activeOrder.secureCode && (
                      <div className="inline-flex mt-1 px-2.5 py-1 rounded bg-surface-container border border-outline-variant/15 font-mono text-[10px] text-primary font-bold">
                        {isStealthMode ? 'Delivery PIN: ' : 'Secure Handover PIN: '}
                        {activeOrder.secureCode}
                      </div>
                    )}
                  </div>
                </div>

                {/* Progress Stepper */}
                <div className="mt-6">
                  <p className="font-label text-[9px] text-outline uppercase tracking-widest mb-4">Tracking Progress</p>
                  <div className="flex items-center justify-between relative">
                    {/* Background Progress Line */}
                    <div className="absolute left-0 right-0 top-3 h-0.5 bg-surface-container-high z-0" />
                    {/* Active Progress Line */}
                    <div
                      className="absolute left-0 top-3 h-0.5 bg-primary z-0 transition-all duration-500"
                      style={{
                        width: `${(getOrderStatusStep(activeOrder.status) / 3) * 100}%`
                      }}
                    />

                    {/* Steps */}
                    {(isStealthMode
                      ? ['Order Received', 'Kitchen Prep', 'Rider Picked Up', 'Arrived']
                      : ['Order Placed', 'Dispensing', 'In Transit', 'Handover Ready']
                    ).map((stepLabel, idx) => {
                      const currentStep = getOrderStatusStep(activeOrder.status);
                      const isCompleted = idx < currentStep;
                      const isActive = idx === currentStep;

                      return (
                        <div key={idx} className="flex flex-col items-center z-10 relative">
                          <div
                            className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                              isCompleted
                                ? 'bg-primary text-on-primary'
                                : isActive
                                ? 'bg-background border-2 border-primary text-primary scale-110 shadow-[0_0_8px_rgba(208,188,255,0.4)]'
                                : 'bg-surface-container border border-outline-variant/20 text-outline'
                            }`}
                          >
                            {isCompleted ? (
                              <span className="material-symbols-outlined text-xs font-bold">check</span>
                            ) : (
                              <span className="font-headline text-[10px] font-bold">{idx + 1}</span>
                            )}
                          </div>
                          <span
                            className={`font-label text-[9px] mt-2 text-center max-w-[80px] leading-tight ${
                              isActive ? 'text-primary font-bold' : isCompleted ? 'text-on-surface font-medium' : 'text-outline'
                            }`}
                          >
                            {stepLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stats bento */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <StatCard
                icon="stethoscope" label="Consultations"
                value={consultations.length} sub="Total sessions" color="text-primary"
              />
              <StatCard
                icon="medication" label="Active Rx"
                value={consultations.filter(c => c.status === 'ACTIVE').length}
                sub="Prescriptions" color="text-tertiary"
              />
              <StatCard
                icon="biotech" label="Lab Tests"
                value="—" sub="Pending results" color="text-secondary"
              />
            </div>

            {/* Services bento */}
            <div>
              <h2 className="font-headline text-sm font-bold text-on-surface mb-4 uppercase tracking-wide opacity-60">Services</h2>
              <div className="grid grid-cols-3 sm:grid-cols-6 lg:grid-cols-3 xl:grid-cols-6 gap-3">
                {SERVICES.map((s) => (
                  <button
                    key={s.label}
                    onClick={() => s.action ? s.action() : navigate(s.to)}
                    className="flex flex-col items-center gap-2 p-4 rounded-2xl bg-surface-container-low border border-outline-variant/10 hover:bg-surface-container-high transition-all group"
                  >
                    <span
                      className={`material-symbols-outlined text-2xl ${s.color} group-hover:scale-110 transition-transform`}
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      {s.icon}
                    </span>
                    <span className="font-label text-[10px] text-on-surface-variant uppercase tracking-wide text-center">{s.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* ── Right Column: Health Score + Consultations (Spans 4) ──────────── */}
          <div className="md:col-span-12 lg:col-span-4 flex flex-col gap-6">

            {/* Health score */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6 text-center"
            >
              <p className="font-label text-[11px] text-outline uppercase tracking-[0.2em] mb-4">Health Score</p>
              <HealthRing score={78} />
              <p className="font-body text-xs text-on-surface-variant mt-4 opacity-70 leading-relaxed">
                Based on consultation history and activity
              </p>
            </motion.div>

            {/* 3D Health Avatar card */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 }}
              className="bg-gradient-to-br from-surface-container-low to-surface-container-lowest border border-outline-variant/10 rounded-[2rem] p-6 relative overflow-hidden group shadow-card-md"
            >
              <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[40px] pointer-events-none" />
              <div className="relative z-10 flex flex-col gap-4">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">biotech</span>
                  <p className="font-label text-[10px] text-on-surface-variant uppercase tracking-[0.2em]">3D Diagnostics</p>
                </div>
                <div>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Interactive Health Profile</h3>
                  <p className="font-body text-xs text-on-surface-variant mt-1.5 opacity-70 leading-relaxed">
                    Visualize your vitals, biometrics, and body map in real-time.
                  </p>
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(true)}
                  className="w-full bg-surface-container-high border border-outline-variant/15 text-primary hover:text-on-primary hover:bg-primary font-headline text-xs font-bold py-3.5 px-4 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                >
                  <span className="material-symbols-outlined text-[16px]">visibility</span>
                  Examine Avatar
                </button>
              </div>
            </motion.div>

            {/* Recent consultations */}
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-surface-container-low border border-outline-variant/10 rounded-3xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-headline text-sm font-bold text-on-surface">Recent Consultations</h2>
                <button
                  onClick={() => navigate('/directory')}
                  className="font-label text-[10px] text-primary uppercase tracking-widest hover:opacity-70 transition-opacity"
                >
                  New +
                </button>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 rounded-xl bg-surface-container-high animate-pulse" />
                  ))}
                </div>
              ) : consultations.length === 0 ? (
                <div className="text-center py-8">
                  <span className="material-symbols-outlined text-4xl text-outline opacity-40">calendar_month</span>
                  <p className="font-body text-sm text-on-surface-variant mt-2 opacity-60">No consultations yet</p>
                  <button
                    onClick={() => navigate('/directory')}
                    className="mt-4 px-5 py-2 rounded-full bg-primary text-on-primary font-label text-xs uppercase tracking-widest hover:brightness-110 transition-all"
                  >
                    See Doctors
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {consultations.slice(0, 4).map(c => (
                    <ConsultRow key={c.id} consult={c} navigate={navigate} />
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>
      
      {/* ── Modal for 3D Diagnostics ── */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/70 backdrop-blur-md"
              onClick={() => setIsAvatarModalOpen(false)}
            />
            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 250 }}
              className="bg-surface-container-low border border-outline-variant/10 rounded-3xl overflow-hidden w-full max-w-5xl shadow-2xl relative z-10"
            >
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-outline-variant/5 bg-surface-container-low/50 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary text-xl">biotech</span>
                  <h3 className="font-headline text-lg font-bold text-on-surface">Interactive Health Profile</h3>
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="material-symbols-outlined text-outline hover:text-on-surface transition-colors p-2 bg-surface-container-high rounded-full"
                >
                  close
                </button>
              </div>
              
              {/* Diagnostic Overview Container */}
              <div className="p-6 bg-background">
                <DiagnosticOverview
                  patientData={{ nickname: nickname, age: profile?.age || user?.age }}
                  vitals={getMockVitals(user?.publicId)}
                  title="Your Virtual Medical Record"
                  readOnly={true}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
