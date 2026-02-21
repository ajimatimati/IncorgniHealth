import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import PharmacyDashboard from './pages/PharmacyDashboard';
import RiderDashboard from './pages/RiderDashboard';
import ChatRoom from './pages/ChatRoom';
import Profile from './pages/Profile';
import SafeHaven from './pages/SafeHaven';
import SexualHealth from './pages/SexualHealth';
import LivingBackground from './components/LivingBackground';
import MentalWellness from './pages/MentalWellness';
import AdminDashboard from './pages/AdminDashboard';
import Settings from './pages/Settings';
import NotFound from './pages/NotFound';

function AuthGate({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return null;
  if (isAuthenticated) return <Navigate to="/dashboard" replace />;
  return children;
}

function InnerRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Public */}
        <Route path="/auth" element={<AuthGate><Auth /></AuthGate>} />

        {/* Authenticated */}
        <Route element={<Layout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/doctor-dashboard" element={<DoctorDashboard />} />
          <Route path="/pharmacy-dashboard" element={<PharmacyDashboard />} />
          <Route path="/rider-dashboard" element={<RiderDashboard />} />
          <Route path="/chat/:id" element={<ChatRoom />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/safe-haven" element={<SafeHaven />} />
          <Route path="/sexual-health" element={<SexualHealth />} />
          <Route path="/mental-wellness" element={<MentalWellness />} />
          <Route path="/admin" element={<AdminDashboard />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Redirects & 404 */}
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </AnimatePresence>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 -z-10 bg-primary overflow-hidden pointer-events-none">
        <LivingBackground />
        
        {/* Subtle overlay to blend particles with the dark theme */}
        <div className="absolute inset-0 bg-primary/40 pointer-events-none mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
      </div>

      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            <GoogleOAuthProvider clientId="417772465462-2jgn7jc1bsf6bve3p9t97tgn6ob7n0ub.apps.googleusercontent.com">
              <InnerRoutes />
            </GoogleOAuthProvider>
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
