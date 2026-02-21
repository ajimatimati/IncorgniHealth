import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../components/Toast';
import StatusBadge from '../components/StatusBadge';
import EmptyState from '../components/EmptyState';
import AvatarGenerator from '../components/AvatarGenerator';
import ParallaxCard from '../components/ParallaxCard';
import RippleButton from '../components/RippleButton';
import BreathingSkeleton from '../components/BreathingSkeleton';
import PaymentModal from '../components/PaymentModal';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../api';

const ORDER_STEPS = ['PENDING', 'PROCESSING', 'READY_FOR_PICKUP', 'PICKED_UP', 'DELIVERED'];
const STEP_LABELS = ['Ordered', 'Preparing', 'Ready', 'Picked Up', 'Delivered'];

/* ── SVG Icon Library ── */
const SvgIcons = {
  stethoscope: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 00-.491 6.347A48.62 48.62 0 0112 20.904a48.62 48.62 0 018.232-4.41 60.46 60.46 0 00-.491-6.347m-15.482 0a50.636 50.636 0 00-2.658-.813A59.906 59.906 0 0112 3.493a59.903 59.903 0 0110.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0112 13.489a50.717 50.717 0 017.74-3.342" />
    </svg>
  ),
  pill: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19 14.5M14.25 3.104c.251.023.501.05.75.082M19 14.5l-2.47 2.47a3.375 3.375 0 01-4.769.06l-.311-.31a3.375 3.375 0 00-4.773-.063L5 14.5m14 0V17a3 3 0 01-3 3h-2.25" />
    </svg>
  ),
  shield: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  ),
  heart: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
    </svg>
  ),
  brain: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18" />
    </svg>
  ),
  chartBar: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
    </svg>
  ),
  cube: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 7.5l-9-5.25L3 7.5m18 0l-9 5.25m9-5.25v9l-9 5.25M3 7.5l9 5.25M3 7.5v9l9 5.25m0-9v9" />
    </svg>
  ),
  lock: (
    <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
    </svg>
  ),
  eyeOpen: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  ),
  eyeClosed: (
    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    </svg>
  ),
};

/* ── Health Score Ring ── */
function HealthScoreRing({ score = 72 }) {
  const circumference = 2 * Math.PI * 45; // radius=45
  const target = circumference - (score / 100) * circumference;
  const color = score >= 75 ? '#10b981' : score >= 50 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative w-28 h-28 flex items-center justify-center shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full health-ring">
        <circle cx="50" cy="50" r="45" className="health-ring-track" strokeWidth="6" />
        <circle
          cx="50" cy="50" r="45"
          className="health-ring-fill"
          stroke={color}
          strokeWidth="6"
          style={{ '--ring-target': target }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-white animate-count-up">{score}</span>
        <span className="text-[10px] text-text-muted uppercase tracking-wider">Score</span>
      </div>
    </div>
  );
}

const Dashboard = () => {
  const [orders, setOrders] = useState([]);
  const [consultations, setConsultations] = useState([]);
  const [walletBalance, setWalletBalance] = useState(null);
  const [loading, setLoading] = useState(true);
  const [discreteMode, setDiscreteMode] = useState(() => localStorage.getItem('discreteMode') === 'true');
  const [showTopUp, setShowTopUp] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();

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
      } catch (err) {
        console.error('Dashboard fetch error:', err);
        toast.error('Failed to load some dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleDiscrete = () => {
    const val = !discreteMode;
    setDiscreteMode(val);
    localStorage.setItem('discreteMode', val);
  };

  const handleStartConsultation = async () => {
    try {
      const res = await api.post('/consultation/start');
      toast.success('Consultation started! Waiting for a doctor...');
      navigate(`/chat/${res.data.id}`);
    } catch {
      toast.error('Could not start consultation.');
    }
  };

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const services = discreteMode
    ? [
        { label: 'Project Review', desc: 'Connect with an advisor', icon: SvgIcons.chartBar, gradient: 'from-blue-500/10 to-cyan-500/10 border-blue-500/20 hover:border-blue-400/40', action: handleStartConsultation },
        { label: 'Supply Order', desc: 'Restock essentials', icon: SvgIcons.cube, gradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-400/40', action: () => toast.info('Coming soon.') },
        { label: 'Secure Report', desc: 'Confidential review', icon: SvgIcons.lock, gradient: 'from-orange-500/10 to-amber-500/10 border-orange-500/20 hover:border-orange-400/40', action: () => navigate('/safe-haven') },
      ]
    : [
        { label: 'General Consult', desc: 'Talk to a doctor', icon: SvgIcons.stethoscope, gradient: 'from-action/10 to-cyan-500/10 border-action/20 hover:border-action/50', action: handleStartConsultation },
        { label: 'Get Medication', desc: 'Order & deliver', icon: SvgIcons.pill, gradient: 'from-emerald-500/10 to-teal-500/10 border-emerald-500/20 hover:border-emerald-400/50', action: () => toast.info('Coming soon — start a consultation first.') },
        { label: 'Safe Haven', desc: 'Support for survivors', icon: SvgIcons.shield, gradient: 'from-accent-purple/10 to-purple-500/10 border-accent-purple/20 hover:border-accent-purple/50', action: () => navigate('/safe-haven') },
        { label: 'Sexual Health', desc: 'Discreet testing', icon: SvgIcons.heart, gradient: 'from-pink-500/10 to-rose-500/10 border-pink-500/20 hover:border-pink-400/50', action: () => navigate('/sexual-health') },
        { label: 'Mental Wellness', desc: 'Guided self-care', icon: SvgIcons.brain, gradient: 'from-amber-500/10 to-orange-500/10 border-amber-500/20 hover:border-amber-400/50', action: () => navigate('/mental-wellness') },
      ];

  const activeOrders = orders.filter(o => o.status !== 'DELIVERED');
  const recentConsults = consultations.slice(0, 5);

  // Quick stats
  const stats = useMemo(() => [
    { label: 'Consultations', value: consultations.length, color: 'text-action' },
    { label: 'Orders', value: orders.length, color: 'text-emerald-400' },
    { label: 'Active', value: activeOrders.length, color: 'text-amber-400' },
  ], [consultations, orders, activeOrders]);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4 }}
      className="min-h-screen p-4 sm:p-6 lg:p-10 max-w-6xl mx-auto relative z-10 text-text-primary"
    >
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 lg:mr-12">
        <div className="relative">
           {/* Glow behind title */}
           <div className="absolute -left-10 -top-10 w-32 h-32 bg-action/20 rounded-full blur-[60px] pointer-events-none"></div>
           
           <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {greeting()}, <span className="text-transparent bg-clip-text bg-gradient-to-r from-action to-action-end">{user?.nickname || user?.publicId}</span>
          </h1>
          <p className="text-text-secondary mt-2 flex items-center gap-2">
            {discreteMode ? 'Startup workspace mode active' : 'Your anonymous health command center'}
            {!discreteMode && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>}
          </p>
        </div>

        <RippleButton
          onClick={toggleDiscrete}
          variant="secondary"
          className={`px-4 py-2.5 rounded-xl text-sm font-semibold transition-all border backdrop-blur-md shadow-lg ${
            discreteMode
              ? 'bg-amber-500/10 text-amber-400 border-amber-500/20 hover:bg-amber-500/20'
              : 'bg-white/5 text-text-secondary border-white/10 hover:text-white hover:border-white/30'
          }`}
        >
          {discreteMode ? SvgIcons.eyeClosed : SvgIcons.eyeOpen}
          {discreteMode ? 'Stealth ON' : 'Stealth OFF'}
        </RippleButton>
      </div>

      {/* Health Score + Wallet Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-10">
        {/* Health Score */}
        <div className="glass-card-glow p-6 flex items-center gap-6">
          <HealthScoreRing score={72} />
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted mb-1">Health Score</p>
            <p className="text-sm text-text-secondary leading-relaxed">
              Based on your activity, consultations, and engagement. Keep it going.
            </p>
            <div className="flex gap-3 mt-3">
              {stats.map((s, i) => (
                <div key={i} className="stat-pill">
                  <span className={`${s.color} font-bold`}>{s.value}</span>
                  <span className="text-text-dim">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="lg:col-span-2 relative group">
          <ParallaxCard className="h-full p-8 flex flex-col justify-center">
            <div className="relative z-10 flex items-center justify-between h-full w-full">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.15em] text-text-muted mb-2">Wallet Balance</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl sm:text-5xl font-mono font-bold text-white text-glow">
                    {'\u20A6'}{walletBalance !== null ? walletBalance.toLocaleString() : '\u2014'}
                  </span>
                  <span className="text-sm text-text-dim">.00</span>
                </div>
              </div>
              
              <RippleButton
                onClick={() => setShowTopUp(true)}
                className="rounded-full w-14 h-14 sm:w-auto sm:h-auto sm:px-6 sm:py-3 flex items-center justify-center gap-2 bg-action text-white hover:brightness-110 shadow-glow"
              >
                <svg className="w-6 h-6 sm:w-5 sm:h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                </svg>
                <span className="hidden sm:inline font-bold">Add Funds</span>
              </RippleButton>
            </div>
          </ParallaxCard>
        </div>
      </div>

      {/* Services Grid */}
      <div className="mb-12">
        <h2 className="section-title">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          {services.map((s, i) => (
            <ParallaxCard
              key={i}
              onClick={s.action}
              className={`group text-left p-5 sm:p-6 transition-all duration-300 ${s.gradient} animate-slide-up`}
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <span className="mb-4 block text-text-muted group-hover:text-action transition-colors">{s.icon}</span>
              <p className="font-bold text-base text-white group-hover:text-action transition-colors">{s.label}</p>
              <p className="text-xs text-text-secondary mt-1">{s.desc}</p>
            </ParallaxCard>
          ))}
        </div>
      </div>

      {/* Active Orders */}
      {loading ? (
        <div className="space-y-4 mb-12">
          {[1, 2].map(i => <BreathingSkeleton key={i} className="h-32" />)}
        </div>
      ) : activeOrders.length > 0 && (
        <div className="mb-12">
          <h2 className="section-title">Active Orders</h2>
          <div className="grid gap-6">
            {activeOrders.map((order) => {
              const currentStep = ORDER_STEPS.indexOf(order.status);
              return (
                <div key={order.id} className="glass-card p-5 sm:p-6 border-l-4 border-l-action">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                      <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Order ID</p>
                      <p className="font-mono text-lg font-bold text-white tracking-wide">{order.publicOrderId}</p>
                    </div>
                    <StatusBadge status={order.status} />
                  </div>

                  {/* Step progress */}
                  <div className="relative">
                     <div className="overflow-hidden h-1.5 mb-4 text-xs flex rounded-full bg-surface-alt">
                        <div style={{ width: `${((currentStep + 1) / ORDER_STEPS.length) * 100}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-gradient-to-r from-action to-action-end transition-all duration-500 ease-out"></div>
                     </div>
                     <div className="flex justify-between w-full">
                        {STEP_LABELS.map((label, idx) => (
                           <div key={label} className={`flex flex-col items-center ${idx <= currentStep ? 'opacity-100' : 'opacity-40'}`}>
                             <span className={`text-[10px] font-bold uppercase tracking-wider ${idx <= currentStep ? 'text-action' : 'text-text-dim'}`}>{label}</span>
                           </div>
                        ))}
                     </div>
                  </div>

                  {order.secureCode && (
                    <div className="mt-6 pt-4 border-t border-white/10 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-action/20 flex items-center justify-center text-action">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                      </div>
                      <div>
                        <p className="text-[10px] text-text-muted uppercase tracking-wider">Secure Handover Code</p>
                        <p className="font-mono text-xl font-bold text-action text-glow">{order.secureCode}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Consultations */}
      <div className="mb-12">
        <h2 className="section-title">Recent Consultations</h2>
        {loading ? (
          <div className="space-y-3">
            {[1, 2].map(i => <BreathingSkeleton key={i} className="h-20" />)}
          </div>
        ) : recentConsults.length === 0 ? (
          <EmptyState
            svgIcon={
              <svg className="w-8 h-8 text-text-dim" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
              </svg>
            }
            title={discreteMode ? "No meetings yet" : "No consultations yet"}
            description={discreteMode ? "Start a project review to get going." : "Start a consultation to talk to a doctor anonymously."}
          />
        ) : (
          <div className="grid gap-3">
            {recentConsults.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/chat/${c.id}`)}
                className="glass-card p-4 flex items-center justify-between hover:bg-white/5 hover:border-white/20 hover:shadow-glow transition-all cursor-pointer group"
              >
                <div className="flex items-center gap-4">
                  <AvatarGenerator seed={c.doctor?.publicId || c.id} size="md" />
                  <div>
                    <p className="font-bold text-white group-hover:text-action transition-colors">{c.doctor?.publicId || 'Unassigned'}</p>
                    <p className="text-xs text-text-muted mt-0.5 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-50"></span>
                      {c._count?.messages || 0} messages
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <StatusBadge status={c.status} />
                  <p className="text-[10px] text-text-dim mt-2 font-mono">
                    {new Date(c.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <AnimatePresence>
        {showTopUp && (
          <PaymentModal
            amount={0} // Let user input amount since it's a topup
            type="Wallet Top-up"
            payerId={user?.email || user?.publicId}
            onClose={() => setShowTopUp(false)}
            onSuccess={(data) => {
              // Optimistically update wallet if back-end doesn't return new balance immediately
              setWalletBalance(prev => (prev || 0) + Number(data.amount));
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default Dashboard;
