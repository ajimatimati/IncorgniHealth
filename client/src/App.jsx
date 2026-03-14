import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ToastProvider } from './components/Toast';
import { SocketProvider } from './context/SocketContext';
import ErrorBoundary from './components/ErrorBoundary';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import { GoogleOAuthProvider } from '@react-oauth/google';
import LivingBackground from './components/LivingBackground';

// ─── Lazy-loaded pages (code splitting — each page is its own JS chunk) ───────
const Welcome           = lazy(() => import('./pages/Welcome'));
const Auth              = lazy(() => import('./pages/Auth'));
const Dashboard         = lazy(() => import('./pages/Dashboard'));
const DoctorDashboard   = lazy(() => import('./pages/DoctorDashboard'));
const PharmacyDashboard = lazy(() => import('./pages/PharmacyDashboard'));
const RiderDashboard    = lazy(() => import('./pages/RiderDashboard'));
const LabDashboard      = lazy(() => import('./pages/LabDashboard'));
const ChatRoom          = lazy(() => import('./pages/ChatRoom'));
const WaitingRoom       = lazy(() => import('./pages/WaitingRoom'));
const VideoConsultation = lazy(() => import('./pages/VideoConsultation'));
const DoctorDirectory   = lazy(() => import('./pages/DoctorDirectory'));
const PostConsultationReview = lazy(() => import('./pages/PostConsultationReview'));
const Profile           = lazy(() => import('./pages/Profile'));
const SafeHaven         = lazy(() => import('./pages/SafeHaven'));
const Sarc              = lazy(() => import('./pages/Sarc'));
const EvidenceGuide     = lazy(() => import('./pages/EvidenceGuide'));
const LegalRights       = lazy(() => import('./pages/LegalRights'));
const SexualHealth      = lazy(() => import('./pages/SexualHealth'));
const MentalWellness    = lazy(() => import('./pages/MentalWellness'));
const AdminDashboard    = lazy(() => import('./pages/AdminDashboard'));
const Settings          = lazy(() => import('./pages/Settings'));
const NotFound          = lazy(() => import('./pages/NotFound'));

// ─── Loading fallback shown while lazy chunks download ────────────────────────
function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-[#011e3b] z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-[3px] border-blue-500 rounded-full border-t-transparent animate-spin" />
        <p className="text-[10px] font-mono tracking-widest text-blue-400 uppercase">Loading...</p>
      </div>
    </div>
  );
}

// ─── Auth gate: redirect authenticated users away from /auth ──────────────────
function AuthGate({ children }) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) return <PageLoader />;

  if (isAuthenticated && user) {
    const roleRoutes = {
      DOCTOR:      '/doctor-dashboard',
      PHARMACY:    '/pharmacy-dashboard',
      RIDER:       '/rider-dashboard',
      ADMIN:       '/admin',
      PATIENT:     '/dashboard',
    };
    const target = roleRoutes[user.role] || '/dashboard';
    return <Navigate to={target} replace />;
  }

  return children;
}

// ─── Inner route tree ─────────────────────────────────────────────────────────
function InnerRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Suspense fallback={<PageLoader />}>
        <Routes location={location} key={location.pathname}>
          {/* Public */}
          <Route path="/auth" element={<AuthGate><Auth /></AuthGate>} />

          {/* Authenticated — role-guarded */}
          <Route element={<Layout />}>
            {/* Any authenticated user */}
            <Route path="/dashboard"     element={<ProtectedRoute roles={['PATIENT','DOCTOR','LAB_SCIENTIST','SARC_OFFICER']}><Dashboard /></ProtectedRoute>} />
            <Route path="/directory"     element={<ProtectedRoute roles={['PATIENT']}><DoctorDirectory /></ProtectedRoute>} />
            <Route path="/profile"       element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings"      element={<ProtectedRoute><Settings /></ProtectedRoute>} />
            <Route path="/safe-haven"    element={<ProtectedRoute><SafeHaven /></ProtectedRoute>} />
            <Route path="/sarc"          element={<ProtectedRoute><Sarc /></ProtectedRoute>} />
            <Route path="/safe-haven/evidence-guide" element={<ProtectedRoute><EvidenceGuide /></ProtectedRoute>} />
            <Route path="/safe-haven/legal-rights"   element={<ProtectedRoute><LegalRights /></ProtectedRoute>} />
            <Route path="/sexual-health"  element={<ProtectedRoute><SexualHealth /></ProtectedRoute>} />
            <Route path="/mental-wellness" element={<ProtectedRoute><MentalWellness /></ProtectedRoute>} />
            <Route path="/chat/:id"       element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />

            {/* Role-locked routes */}
            <Route path="/doctor-dashboard"  element={<ProtectedRoute roles={['DOCTOR','ADMIN']}><DoctorDashboard /></ProtectedRoute>} />
            <Route path="/pharmacy-dashboard" element={<ProtectedRoute roles={['PHARMACY','ADMIN']}><PharmacyDashboard /></ProtectedRoute>} />
            <Route path="/rider-dashboard"   element={<ProtectedRoute roles={['RIDER','ADMIN']}><RiderDashboard /></ProtectedRoute>} />
            <Route path="/lab-dashboard"     element={<ProtectedRoute roles={['LAB_SCIENTIST','ADMIN']}><LabDashboard /></ProtectedRoute>} />
            <Route path="/admin"             element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />
            <Route path="/waiting-room/:doctorId" element={<ProtectedRoute roles={['PATIENT']}><WaitingRoom /></ProtectedRoute>} />
            <Route path="/consult/:id"       element={<ProtectedRoute roles={['PATIENT','DOCTOR']}><VideoConsultation /></ProtectedRoute>} />
            <Route path="/review/:id"        element={<ProtectedRoute roles={['PATIENT']}><PostConsultationReview /></ProtectedRoute>} />
          </Route>

          {/* Redirects & 404 */}
          <Route path="/" element={<AuthGate><Welcome /></AuthGate>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
function App() {
  return (
    <ErrorBoundary>
      <div className="fixed inset-0 -z-10 bg-primary overflow-hidden pointer-events-none">
        <LivingBackground />
        <div className="absolute inset-0 bg-primary/40 pointer-events-none mix-blend-multiply" />
        <div className="absolute inset-0 bg-[url('/noise.png')] opacity-[0.02] mix-blend-overlay pointer-events-none" />
      </div>

      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
                <InnerRoutes />
              </GoogleOAuthProvider>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}

export default App;
