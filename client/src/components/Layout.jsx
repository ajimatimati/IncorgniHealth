import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import OfflineBanner from './OfflineBanner';
import NotificationCenter from './NotificationCenter';
import { motion } from 'framer-motion';
import { ShieldCheck } from 'lucide-react';

function LoadingScreen() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[#F8F7F6]">
      <div className="flex flex-col items-center gap-5">
        <div className="w-12 h-12 rounded-2xl bg-[#6D28D9] flex items-center justify-center shadow-[0_4px_16px_rgba(109,40,217,0.25)]">
          <ShieldCheck className="w-6 h-6 text-white" strokeWidth={2} />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-[#18181B]" style={{ fontFamily: '"Plus Jakarta Sans", sans-serif' }}>
            Incognihealth
          </p>
          <p className="text-xs text-[#A1A1AA] mt-1">Loading your session…</p>
        </div>
      </div>
    </div>
  );
}

export default function Layout() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat/');

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate('/auth');
  }, [loading, isAuthenticated, navigate]);

  if (loading) return <LoadingScreen />;
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-dvh bg-[#F8F7F6]">
      <OfflineBanner />
      <Sidebar />

      {/* Notification bell — desktop only */}
      <div className="hidden lg:block fixed top-5 right-7 z-30">
        <NotificationCenter />
      </div>

      {/* Page content */}
      <main className={`lg:ml-64 min-h-dvh ${isChat ? '' : 'pb-24 lg:pb-0'}`}>
        <motion.div
          key={location.pathname}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        >
          <Outlet />
        </motion.div>
      </main>
    </div>
  );
}
