import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import UtilityRail from './UtilityRail';
import OfflineBanner from './OfflineBanner';
import { motion } from 'framer-motion';

function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <div className="text-center">
          <p className="font-headline text-sm text-on-surface">IncogniCare</p>
          <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em] mt-1">Loading session…</p>
        </div>
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
        </main>
      </div>

      {/* Persistent Desktop Utility Rail */}
      {!isFullScreen && <UtilityRail />}
    </div>
  );
}
