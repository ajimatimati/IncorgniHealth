import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
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

// Greeting helper
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

// Beautiful animated SVG heartbeat wave graph
function HeartRateWave() {
  return (
    <div className="w-full h-12 mt-2 relative select-none overflow-hidden">
      <svg className="w-full h-full" viewBox="0 0 300 50" preserveAspectRatio="none">
        <path
          d="M0 25 L50 25 L60 10 L70 40 L80 25 L120 25 L130 5 L140 45 L150 25 L200 25 L210 15 L220 35 L230 25 L300 25"
          fill="none"
          stroke="rgba(255,255,255,0.25)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <motion.path
          d="M0 25 L50 25 L60 10 L70 40 L80 25 L120 25 L130 5 L140 45 L150 25 L200 25 L210 15 L220 35 L230 25 L300 25"
          fill="none"
          stroke="#ffffff"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
        />
      </svg>
    </div>
  );
}

// ── Stat Card with luxury details ──
function StatCard({ icon, label, value, sub, color = 'text-white' }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-5 flex flex-col justify-between hover:border-white/10 transition-all duration-300 shadow-sm relative overflow-hidden group">
      <div className="flex justify-between items-start">
        <div className={`w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center ${color} border border-white/10`}>
          <span className="material-symbols-outlined text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>{icon}</span>
        </div>
        {label === 'Consultations' && (
          <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
        )}
      </div>
      <div className="mt-4">
        <p className="font-sans text-xl font-bold text-white">{value ?? '—'}</p>
        <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest mt-0.5 font-semibold">{label}</p>
        {sub && <p className="font-sans text-[10px] text-white/50 mt-1">{sub}</p>}
      </div>
      <div className="absolute inset-0 bg-gradient-to-r from-white/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </div>
  );
}

// ── Consultation Row ──
function ConsultRow({ consult, navigate }) {
  const date = new Date(consult.updatedAt || consult.createdAt);
  const label = date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  const statusColor = {
    ACTIVE:    'text-white bg-white/10 border border-white/10',
    COMPLETED: 'text-white/60 bg-white/5 border border-white/5',
    PENDING:   'text-white/30 bg-white/[0.02] border border-white/5',
  }[consult.status] || 'text-white/30 bg-white/[0.02]';

  return (
    <button
      onClick={() => navigate(`/chat/${consult.id}`)}
      className="w-full flex items-center gap-4 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/15 transition-all text-left group"
    >
      <div className="w-9 h-9 rounded-xl bg-white/5 flex items-center justify-center shrink-0 border border-white/10">
        <span className="material-symbols-outlined text-white text-sm" style={{ fontVariationSettings: "'FILL' 1" }}>stethoscope</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-sans text-xs font-bold text-white truncate">
          Dr. {consult.doctor?.publicId || 'Assigned Doctor'}
        </p>
        <p className="font-mono text-[8px] text-white/40 mt-0.5 uppercase tracking-wide font-semibold">{label}</p>
      </div>
      <span className={`font-mono text-[8px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold ${statusColor}`}>
        {consult.status?.toLowerCase()}
      </span>
      <span className="material-symbols-outlined text-white/40 group-hover:text-white text-base transition-colors">chevron_right</span>
    </button>
  );
}

// ── Health Score Ring with Luxury Visual Design ──
function HealthRing({ score = 78 }) {
  const r = 40, c = 2 * Math.PI * r;
  const dash = (score / 100) * c;
  return (
    <div className="relative w-28 h-28 mx-auto select-none">
      <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
        <circle cx="50" cy="50" r={r} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="6" />
        <motion.circle
          cx="50" cy="50" r={r} fill="none"
          stroke="#ffffff" strokeWidth="6"
          strokeLinecap="round"
          initial={{ strokeDasharray: `0 ${c}` }}
          animate={{ strokeDasharray: `${dash} ${c}` }}
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-sans text-2xl font-black text-white">{score}</span>
        <span className="font-mono text-[8px] text-white/40 uppercase tracking-widest">Wellness INDEX</span>
      </div>
    </div>
  );
}

// ── Breathing Skeleton Loader ──
function BreathingLoader() {
  return (
    <div className="space-y-6 w-full animate-pulse">
      <div className="h-44 bg-white/[0.02] border border-white/5 rounded-[2rem]" />
      <div className="grid grid-cols-3 gap-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-28 bg-white/[0.02] border border-white/5 rounded-2xl" />
        ))}
      </div>
    </div>
  );
}

const SERVICES = [
  { icon: 'stethoscope',    label: 'Consult',       to: '/directory',       color: 'text-white'    },
  { icon: 'medication',     label: 'Pharmacy',      to: '/pharmacy',        color: 'text-white/60'   },
  { icon: 'medical_information', label: 'Care Hub', to: '/specialized',     color: 'text-white'      },
  { icon: 'shield_with_heart', label: 'Safe Haven', to: '/safe-haven',      color: 'text-white'      },
  { icon: 'diversity_1',    label: 'Coaching',      to: '/coaching',        color: 'text-white/60'   },
  { icon: 'health_and_safety', label: 'Sexual Health', to: '/sexual-health', color: 'text-white/80' },
  { icon: 'self_improvement',  label: 'Wellness',   to: '/mental-wellness', color: 'text-white/40'    },
  { icon: 'local_hospital', label: 'Emergency',     action: () => window.dispatchEvent(new Event('open-sos')), color: 'text-white' },
];

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile]         = useState(null);
  const [consultations, setConsults]  = useState([]);
  const [orders, setOrders]           = useState([]);
  const [loading, setLoading]         = useState(true);
  const [isAvatarModalOpen, setIsAvatarModalOpen] = useState(false);
  const [isStealthMode, setIsStealthMode] = useState(() => localStorage.getItem('stealth_mode') === 'true');
  const [tourStep, setTourStep] = useState(null);

  const TOUR_STEPS = [
    {
      title: "Welcome to IncogniCare",
      content: "This is your secure, encrypted medical dashboard. Here you can track wellness markers and access clinical services with total privacy.",
      actionText: "Next Step"
    },
    {
      title: "Care Wallet & Deposits",
      content: "Fund your account anonymously using Moniepoint. Debit your balance instantly for doctor checkups, lab requests, or pharmacy items.",
      actionText: "Next Step"
    },
    {
      title: "Specialized Nigerian Portals",
      content: "Access localized care pathways tailored for Women's Maternal health, Oncology cycle logging, and NCD chronic disease trackers.",
      actionText: "Next Step"
    },
    {
      title: "3D Body Mapping Vitals",
      content: "Launch the clinical body map wireframe to visualize active symptoms and review diagnostic indexes in real-time.",
      actionText: "Next Step"
    },
    {
      title: "Stealth Mode & Quick Exit",
      content: "Under physical surveillance? Use the Stealth toggle on active orders to disguise the page as a Jumia Food delivery order, or click the Exit button in the footer menu to instantly jump to weather.com.",
      actionText: "Finish Tour"
    }
  ];

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

  useEffect(() => {
    if (!loading) {
      const tourCompleted = localStorage.getItem('dashboard_tour_completed') === 'true';
      if (!tourCompleted) {
        setTourStep(0);
      }
    }
  }, [loading]);

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
    <div className="bg-[#010101] min-h-screen text-white select-none">
      <div className="max-w-7xl mx-auto px-6 sm:px-10 py-10 lg:py-14">

        {/* Page header */}
        <header className={`mb-10 space-y-1 transition-all duration-500 rounded-3xl p-4 -m-4 ${
          tourStep === 0 ? 'bg-white/[0.03] border border-white/10 shadow-[0_0_30px_rgba(255,255,255,0.05)] scale-[1.01]' : 'border border-transparent'
        }`}>
          <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em] font-semibold">{getGreeting()}</p>
          <h1 className="font-sans text-3xl sm:text-4xl font-black text-white tracking-tight">
            How are you feeling, <span className="text-white/40">{nickname}</span>?
          </h1>
          <p className="font-sans text-xs text-white/50">
            Secure, encrypted medical ledger.
          </p>
        </header>

        {loading ? (
          <BreathingLoader />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

            {/* Left Bento: Balances, Deliveries, Stats */}
            <div className="lg:col-span-8 space-y-6">

              {/* Wallet Card */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`bg-white/[0.02] border rounded-[2.5rem] p-6 sm:p-8 relative overflow-hidden group shadow-lg bento-glass care-wallet-tour-target transition-all duration-500 ${
                  tourStep === 1 ? 'border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.01]' : 'border-white/5'
                }`}
              >
                <div className="flex flex-col relative z-10">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow">
                        <span className="material-symbols-outlined text-white text-sm">account_balance_wallet</span>
                      </div>
                      <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.25em] font-semibold">Care Wallet</p>
                    </div>
                    <div className="flex items-center gap-2 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                      <p className="font-mono text-[8px] text-white/50 uppercase tracking-widest">Available</p>
                    </div>
                  </div>
                  
                  <div className="flex items-baseline mt-8 mb-2">
                    <span className="font-sans text-2xl font-bold text-white/40 mr-1.5">₦</span>
                    <p className="font-sans text-4xl sm:text-5xl font-black text-white tracking-tight">
                      {balance.toLocaleString()}
                    </p>
                  </div>
                </div>
                
                <div className="mt-8 relative z-10 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full sm:flex-1 bg-white text-black font-sans text-xs font-bold py-3.5 px-6 rounded-full hover:bg-white/90 active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow"
                  >
                    <span className="material-symbols-outlined text-sm">add</span>
                    Top-up Funds
                  </button>
                  <button
                    onClick={() => navigate('/profile')}
                    className="w-full sm:flex-1 bg-white/5 border border-white/10 text-white font-sans text-xs font-bold py-3.5 px-6 rounded-full hover:bg-white/10 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
                  >
                    <span className="material-symbols-outlined text-sm">history</span>
                    Ledger Audit
                  </button>
                </div>
              </motion.div>

              {/* Specialized Nigerian Health Portals */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 shadow-md relative overflow-hidden bento-glass specialized-portals-tour-target"
              >
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center border border-white/10 shadow">
                    <span className="material-symbols-outlined text-white text-sm">medical_information</span>
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-bold text-white">Specialized Care Portals</h3>
                    <p className="font-mono text-[9px] text-white/40 uppercase tracking-widest font-semibold">Localized Nigerian Support Pathways</p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6">
                  {[
                    { title: "Women's Health", desc: "Maternal guides, ovulation/cycle logs & anonymous gynecology directories.", icon: "pregnancy", cat: "womens-health" },
                    { title: "Oncology Support", desc: "Chemo cycles logger, reminders & direct Nigerian cancer foundations lookup.", icon: "medical_services", cat: "oncology" },
                    { title: "NCD Care Tracker", desc: "Cardiovascular BP & Blood Glucose loggers with custom local diet guides.", icon: "health_metrics", cat: "ncd" }
                  ].map((port) => (
                    <button
                      key={port.title}
                      onClick={() => navigate('/specialized', { state: { category: port.cat } })}
                      className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:bg-white/5 hover:border-white/15 transition-all text-left flex flex-col justify-between group"
                    >
                      <div>
                        <span className="material-symbols-outlined text-lg text-white/70 mb-3 group-hover:scale-105 transition-transform">{port.icon}</span>
                        <h4 className="font-sans text-xs font-bold text-white mb-1">{port.title}</h4>
                        <p className="font-sans text-[10px] text-white/40 leading-relaxed mb-4">{port.desc}</p>
                      </div>
                      <span className="font-mono text-[8px] text-white/60 uppercase tracking-wider flex items-center gap-1 mt-auto group-hover:text-white transition-colors">
                        Launch Portal
                        <span className="material-symbols-outlined text-[10px]">arrow_forward</span>
                      </span>
                    </button>
                  ))}
                </div>
              </motion.div>

              {/* Delivery Tracking */}
              {activeOrder && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 shadow-md relative overflow-hidden bento-glass"
                >
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-white">
                        <span className="material-symbols-outlined text-base">
                          {isStealthMode ? 'restaurant' : 'local_shipping'}
                        </span>
                      </div>
                      <div>
                        <h3 className="font-sans text-sm font-bold text-white">
                          {isStealthMode ? 'Food Delivery Order' : 'Discreet Transit Pack'}
                        </h3>
                        <p className="font-mono text-[9px] text-white/40 uppercase tracking-wider font-semibold">
                          {isStealthMode ? '#Jumia-382901' : activeOrder.publicOrderId}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={toggleStealthMode}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${
                        isStealthMode
                          ? 'bg-white/10 border-white/20 text-white'
                          : 'bg-white/[0.02] border-white/5 text-white/40 hover:text-white'
                      }`}
                    >
                      <span className="material-symbols-outlined text-xs">
                        {isStealthMode ? 'visibility_off' : 'visibility'}
                      </span>
                      <span className="font-mono text-[8px] uppercase tracking-wider font-bold">
                        {isStealthMode ? 'STEALTH ON' : 'STEALTH OFF'}
                      </span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6 border-b border-white/5">
                    <div className="space-y-1">
                      <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold">
                        {isStealthMode ? 'Mock Item Ordered' : 'Encrypted Package'}
                      </p>
                      <p className="font-sans text-xs font-bold text-white">
                        {isStealthMode ? 'Classic Cheeseburger Combo' : (activeOrder.prescription?.medications?.[0]?.name || 'Clinical Care Kit')}
                      </p>
                      <p className="font-sans text-[10px] text-white/50 mt-0.5">
                        {isStealthMode ? 'Jumia Delivery Store' : 'Discreet Clinical Pharmacy'}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold">
                        {isStealthMode ? 'Recipient Terminal' : 'Delivery Destination'}
                      </p>
                      <p className="font-sans text-xs text-white truncate">
                        {isStealthMode ? 'Private Office Suite, Lekki' : (activeOrder.deliveryAddress || 'Secure Transit Point')}
                      </p>
                      {activeOrder.secureCode && (
                        <div className="inline-flex mt-1.5 px-2.5 py-1 rounded bg-white/5 border border-white/5 font-mono text-[8px] text-white tracking-wider font-bold">
                          PIN // {activeOrder.secureCode}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tracking Stepper */}
                  <div className="mt-6">
                    <p className="font-mono text-[8px] text-white/40 uppercase tracking-widest font-semibold mb-4">Verification Steps</p>
                    <div className="flex items-center justify-between relative">
                      <div className="absolute left-0 right-0 top-3 h-px bg-white/5 z-0" />
                      <div
                        className="absolute left-0 top-3 h-px bg-white z-0 transition-all duration-500"
                        style={{
                          width: `${(getOrderStatusStep(activeOrder.status) / 3) * 100}%`
                        }}
                      />

                      {(isStealthMode
                        ? ['Ordered', 'Preparing', 'Rider Dispatched', 'Arrived']
                        : ['Order Placed', 'Dispensing', 'In Transit', 'Ready']
                      ).map((stepLabel, idx) => {
                        const currentStep = getOrderStatusStep(activeOrder.status);
                        const isCompleted = idx < currentStep;
                        const isActive = idx === currentStep;

                        return (
                          <div key={idx} className="flex flex-col items-center z-10 relative">
                            <div
                              className={`w-6 h-6 rounded-full flex items-center justify-center transition-all ${
                                isCompleted
                                  ? 'bg-white text-black'
                                  : isActive
                                  ? 'bg-black border border-white text-white scale-110 shadow-lg'
                                  : 'bg-black border border-white/10 text-white/30'
                              }`}
                            >
                              {isCompleted ? (
                                <span className="material-symbols-outlined text-xs font-bold">check</span>
                              ) : (
                                <span className="font-mono text-[8px] font-bold">{idx + 1}</span>
                              )}
                            </div>
                            <span
                              className={`font-sans text-[9px] mt-2 text-center max-w-[80px] leading-tight ${
                                isActive ? 'text-white font-bold' : isCompleted ? 'text-white/60' : 'text-white/30'
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

              {/* Vital signs mockup stats */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <StatCard
                  icon="stethoscope" label="Consultations"
                  value={consultations.length} sub="All active sessions" color="text-white"
                />
                <StatCard
                  icon="medication" label="Secure Prescriptions"
                  value={consultations.filter(c => c.status === 'ACTIVE').length}
                  sub="Active treatments" color="text-white/60"
                />
                <StatCard
                  icon="biotech" label="Lab Directives"
                  value="—" sub="No pending results" color="text-white/40"
                />
              </div>

              {/* Quick Actions Grid */}
              <div className="space-y-4">
                <h2 className="font-mono text-[9px] text-white/40 uppercase tracking-wider font-semibold">Secure Modules</h2>
                <div className="grid grid-cols-4 sm:grid-cols-8 gap-3">
                  {SERVICES.map((s) => (
                    <button
                      key={s.label}
                      onClick={() => s.action ? s.action() : navigate(s.to)}
                      className="flex flex-col items-center gap-2.5 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:bg-white/5 hover:border-white/15 transition-all group"
                    >
                      <span
                        className="material-symbols-outlined text-xl text-white group-hover:scale-105 transition-transform"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                      >
                        {s.icon}
                      </span>
                      <span className="font-mono text-[8px] text-white/40 uppercase tracking-widest text-center group-hover:text-white transition-colors">{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Health Ring + Heartrate wave + Consultation Logs */}
            <div className="lg:col-span-4 flex flex-col gap-6">

              {/* Health score & Heartrate wave */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 text-center shadow-lg relative overflow-hidden bento-glass"
              >
                <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em] font-semibold mb-4">Diagnostic Score</p>
                <HealthRing score={78} />
                
                {/* SVG Heartrate Timeline */}
                <div className="mt-6 border-t border-white/5 pt-4">
                  <div className="flex justify-between items-center px-1 mb-2">
                    <span className="font-mono text-[8px] uppercase tracking-widest text-white/40">Cardiac Activity</span>
                    <span className="font-mono text-[9px] text-white font-bold">{getMockVitals(user?.publicId).heartRate} BPM</span>
                  </div>
                  <HeartRateWave />
                </div>
              </motion.div>

              {/* 3D Body Mapping Module */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className={`bg-white/[0.02] border rounded-[2.5rem] p-6 relative overflow-hidden group shadow-lg bento-glass body-map-tour-target transition-all duration-500 ${
                  tourStep === 3 ? 'border-white/30 shadow-[0_0_30px_rgba(255,255,255,0.1)] scale-[1.01]' : 'border-white/5'
                }`}
              >
                <div className="relative z-10 flex flex-col gap-4">
                  <div className="flex items-center gap-2">
                    <span className="material-symbols-outlined text-white text-base">biotech</span>
                    <p className="font-mono text-[9px] text-white/40 uppercase tracking-[0.2em] font-semibold">3D Avatar</p>
                  </div>
                  <div>
                    <h3 className="font-sans text-sm font-bold text-white">Clinical Wireframe Model</h3>
                    <p className="font-sans text-xs text-white/50 mt-1 leading-relaxed">
                      Visualize active body symptoms on a secure interactive wireframe model.
                    </p>
                  </div>
                  <button
                    onClick={() => setIsAvatarModalOpen(true)}
                    className="w-full bg-white text-black hover:bg-white/95 font-sans text-xs font-bold py-3 px-4 rounded-full active:scale-[0.98] transition-all flex items-center justify-center gap-2 shadow"
                  >
                    <span className="material-symbols-outlined text-[16px]">visibility</span>
                    Launch Body Map
                  </button>
                </div>
              </motion.div>

              {/* Consultation Logs */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-6 shadow-lg bento-glass"
              >
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-sans text-xs font-bold text-white uppercase tracking-wider">Clinical Encounters</h2>
                  <button
                    onClick={() => navigate('/directory')}
                    className="font-mono text-[8px] text-white/50 uppercase tracking-widest font-semibold hover:text-white transition-colors"
                  >
                    Consult +
                  </button>
                </div>

                {consultations.length === 0 ? (
                  <div className="text-center py-8">
                    <span className="material-symbols-outlined text-3xl text-white/20">calendar_month</span>
                    <p className="font-sans text-xs text-white/40 mt-2">No active clinic logs</p>
                  </div>
                ) : (
                  <div className="space-y-2.5">
                    {consultations.slice(0, 3).map(c => (
                      <ConsultRow key={c.id} consult={c} navigate={navigate} />
                    ))}
                  </div>
                )}
              </motion.div>
            </div>
          </div>
        )}
      </div>
      
      {/* 3D Body Mapping Modal Overlay */}
      <AnimatePresence>
        {isAvatarModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-[#010101]/80 backdrop-blur-md"
              onClick={() => setIsAvatarModalOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 15 }}
              className="bg-black border border-white/5 rounded-[2.5rem] overflow-hidden w-full max-w-5xl shadow-2xl relative z-10"
            >
              <div className="flex items-center justify-between p-6 border-b border-white/5 bg-white/[0.02]">
                <div className="flex items-center gap-2">
                  <span className="material-symbols-outlined text-white text-base">biotech</span>
                  <h3 className="font-sans text-xs font-bold text-white uppercase tracking-wider">3D Body Mapping Terminal</h3>
                </div>
                <button
                  onClick={() => setIsAvatarModalOpen(false)}
                  className="material-symbols-outlined text-white/50 hover:text-white transition-colors p-1.5 bg-white/5 rounded-full"
                >
                  close
                </button>
              </div>
              
              <div className="p-6 bg-[#010101]">
                <DiagnosticOverview
                  patientData={{ nickname: nickname, age: profile?.age || user?.age }}
                  vitals={getMockVitals(user?.publicId)}
                  title="3D Patient Vitals Overview"
                  readOnly={true}
                />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Onboarding Guided Tour Overlay */}
      <AnimatePresence>
        {tourStep !== null && (
          <div className="fixed inset-0 z-[999] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto"
              onClick={() => {
                localStorage.setItem('dashboard_tour_completed', 'true');
                setTourStep(null);
              }}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-[#0c0c0c] border border-white/10 rounded-[2rem] p-6 max-w-md w-full shadow-2xl relative z-10 bento-glass overflow-hidden text-left"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.01] to-transparent pointer-events-none" />
              
              <div className="flex justify-between items-center mb-4">
                <span className="font-mono text-[9px] text-white/40 uppercase tracking-[0.25em] font-semibold">
                  Step {tourStep + 1} of {TOUR_STEPS.length}
                </span>
                <button
                  onClick={() => {
                    localStorage.setItem('dashboard_tour_completed', 'true');
                    setTourStep(null);
                  }}
                  className="font-mono text-[8px] text-white/40 uppercase tracking-widest hover:text-white transition-colors"
                >
                  Skip Tour
                </button>
              </div>

              {/* Progress Bar */}
              <div className="w-full h-1 bg-white/5 rounded-full mb-6 overflow-hidden">
                <div
                  className="h-full bg-white transition-all duration-300"
                  style={{ width: `${((tourStep + 1) / TOUR_STEPS.length) * 100}%` }}
                />
              </div>

              <h3 className="font-sans text-lg font-bold text-white mb-2">
                {TOUR_STEPS[tourStep].title}
              </h3>
              <p className="font-sans text-xs text-white/60 leading-relaxed mb-6">
                {TOUR_STEPS[tourStep].content}
              </p>

              <div className="flex gap-3 justify-end">
                {tourStep > 0 && (
                  <button
                    onClick={() => setTourStep(prev => prev - 1)}
                    className="px-4 py-2.5 rounded-full border border-white/10 font-sans text-xs text-white/60 hover:text-white transition-all"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={() => {
                    if (tourStep < TOUR_STEPS.length - 1) {
                      setTourStep(prev => prev + 1);
                    } else {
                      localStorage.setItem('dashboard_tour_completed', 'true');
                      setTourStep(null);
                    }
                  }}
                  className="px-6 py-2.5 rounded-full bg-white text-black font-sans text-xs font-bold hover:bg-white/90 active:scale-[0.98] transition-all"
                >
                  {TOUR_STEPS[tourStep].actionText}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
