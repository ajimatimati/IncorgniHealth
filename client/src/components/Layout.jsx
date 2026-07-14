import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import UtilityRail from './UtilityRail';
import OfflineBanner from './OfflineBanner';

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#131313] z-[9999]">
      <div className="flex flex-col items-center gap-5">
        <div className="w-8 h-8 border border-white/10 border-t-[#d0bcff] rounded-full animate-spin" />
        <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-white/50">IncogniCare</p>
      </div>
    </div>
  );
}

// Pages that use their own full-screen layout (no sidebar padding needed)
const FULL_SCREEN_PATHS = ['/chat/', '/consult/', '/waiting-room/', '/rider'];

export default function Layout() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isFullScreen = FULL_SCREEN_PATHS.some(p => location.pathname.startsWith(p));

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/auth', { replace: true });
  }, [loading, isAuthenticated, navigate]);

  if (loading) return <PageLoader />;
  if (!isAuthenticated) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar — fixed on desktop, drawer on mobile (includes mobile topbar + spacer) */}
      <Sidebar />

      {/* Main content area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <OfflineBanner />

        <main
          className={`
            flex-1 overflow-y-auto
            ${isFullScreen ? '' : 'pb-24 lg:pb-0'}
          `}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Persistent Desktop Utility Rail */}
      {!isFullScreen && <UtilityRail />}
    </div>
  );
}
