import { useEffect } from 'react';
import { useNavigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Sidebar from './Sidebar';
import OfflineBanner from './OfflineBanner';
import NotificationCenter from './NotificationCenter';

export default function Layout() {
  const { isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isChat = location.pathname.startsWith('/chat/');

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      navigate('/auth');
    }
  }, [loading, isAuthenticated, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen bg-primary flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-action/30 border-t-action rounded-full animate-spin" />
          <p className="text-sm text-text-muted">Loading your session...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) return null;

  // Determine theme based on route
  const getThemeClass = () => {
    if (location.pathname.startsWith('/safe-haven')) return 'theme-amber';
    if (location.pathname.startsWith('/mental-wellness')) return 'theme-purple';
    if (isChat) return 'theme-chat';
    return 'theme-default';
  };

  return (
    <div className={`min-h-screen bg-primary transition-colors duration-1000 ${getThemeClass()}`}>
      <OfflineBanner />
      <Sidebar />

      {/* Notification bell — top right on desktop */}
      <div className="hidden lg:block fixed top-6 right-8 z-30">
        <NotificationCenter />
      </div>

      <main className={`lg:ml-64 min-h-screen ${isChat ? '' : 'pb-20'} lg:pb-0 relative z-0`}>
        <Outlet />
      </main>
    </div>
  );
}
