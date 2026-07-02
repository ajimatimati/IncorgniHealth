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
import GlobalModals from './components/GlobalModals';

// ─── Lazy pages ───────────────────────────────────────────────────────────────
const Welcome               = lazy(() => import('./pages/Welcome'));
const Auth                  = lazy(() => import('./pages/Auth'));
const Dashboard             = lazy(() => import('./pages/Dashboard'));
const DoctorDashboard       = lazy(() => import('./pages/DoctorDashboard'));
const PharmacyDashboard     = lazy(() => import('./pages/PharmacyDashboard'));
const RiderDashboard        = lazy(() => import('./pages/RiderDashboard'));
const LabDashboard          = lazy(() => import('./pages/LabDashboard'));
const ChatRoom              = lazy(() => import('./pages/ChatRoom'));
const WaitingRoom           = lazy(() => import('./pages/WaitingRoom'));
const VideoConsultation     = lazy(() => import('./pages/VideoConsultation'));
const DoctorDirectory       = lazy(() => import('./pages/DoctorDirectory'));
const PostConsultationReview = lazy(() => import('./pages/PostConsultationReview'));
const Profile               = lazy(() => import('./pages/Profile'));
const SafeHaven             = lazy(() => import('./pages/SafeHaven'));
const Sarc                  = lazy(() => import('./pages/Sarc'));
const EvidenceGuide         = lazy(() => import('./pages/EvidenceGuide'));
const LegalRights           = lazy(() => import('./pages/LegalRights'));
const SexualHealth          = lazy(() => import('./pages/SexualHealth'));
const MentalWellness        = lazy(() => import('./pages/MentalWellness'));
const AdminDashboard        = lazy(() => import('./pages/AdminDashboard'));
const Settings              = lazy(() => import('./pages/Settings'));
const NotFound              = lazy(() => import('./pages/NotFound'));
const PharmacyShop          = lazy(() => import('./pages/PharmacyShop'));
const SarcOfficerDashboard  = lazy(() => import('./pages/SarcOfficerDashboard'));
const CoachingHub           = lazy(() => import('./pages/CoachingHub'));

// ─── Loading fallback ─────────────────────────────────────────────────────────
function PageLoader() {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-background z-50">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-12 h-12">
          <div className="absolute inset-0 rounded-full border-2 border-primary/20" />
          <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-primary animate-spin" />
        </div>
        <p className="font-label text-[10px] text-primary uppercase tracking-[0.2em]">Loading…</p>
      </div>
    </div>
  );
}

// ─── Auth gate: redirect already-authenticated users away from /auth ──────────
function AuthGate({ children }) {
  const { isAuthenticated, loading, user } = useAuth();
  if (loading) return <PageLoader />;
  if (isAuthenticated && user) {
    const ROLE_HOME = {
      PATIENT:       '/dashboard',
      DOCTOR:        '/doctor-dashboard',
      PHARMACY:      '/pharmacy-dashboard',
      RIDER:         '/rider-dashboard',
      LAB_SCIENTIST: '/lab-dashboard',
      SARC_OFFICER:  '/sarc-dashboard',
      ADMIN:         '/admin',
    };
    return <Navigate to={ROLE_HOME[user.role] || '/dashboard'} replace />;
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

          {/* ── Public ── */}
          <Route path="/"     element={<AuthGate><Welcome /></AuthGate>} />
          <Route path="/auth" element={<AuthGate><Auth /></AuthGate>} />

          {/* ── Authenticated shell ── */}
          <Route element={<Layout />}>

            {/* ── Patient-only ── */}
            <Route path="/dashboard"
              element={<ProtectedRoute roles={['PATIENT']}><Dashboard /></ProtectedRoute>} />
            <Route path="/pharmacy"
              element={<ProtectedRoute roles={['PATIENT']}><PharmacyShop /></ProtectedRoute>} />
            <Route path="/directory"
              element={<ProtectedRoute roles={['PATIENT']}><DoctorDirectory /></ProtectedRoute>} />
            <Route path="/waiting-room/:doctorId"
              element={<ProtectedRoute roles={['PATIENT']}><WaitingRoom /></ProtectedRoute>} />
            <Route path="/review/:id"
              element={<ProtectedRoute roles={['PATIENT']}><PostConsultationReview /></ProtectedRoute>} />
            <Route path="/coaching"
              element={<ProtectedRoute roles={['PATIENT']}><CoachingHub /></ProtectedRoute>} />

            {/* ── Doctor-only ── */}
            <Route path="/doctor-dashboard"
              element={<ProtectedRoute roles={['DOCTOR', 'ADMIN']}><DoctorDashboard /></ProtectedRoute>} />

            {/* ── Pharmacy-only ── */}
            <Route path="/pharmacy-dashboard"
              element={<ProtectedRoute roles={['PHARMACY', 'ADMIN']}><PharmacyDashboard /></ProtectedRoute>} />

            {/* ── Rider-only ── */}
            <Route path="/rider-dashboard"
              element={<ProtectedRoute roles={['RIDER', 'ADMIN']}><RiderDashboard /></ProtectedRoute>} />

            {/* ── Lab Scientist-only ── */}
            <Route path="/lab-dashboard"
              element={<ProtectedRoute roles={['LAB_SCIENTIST', 'ADMIN']}><LabDashboard /></ProtectedRoute>} />

            {/* ── Admin-only ── */}
            <Route path="/admin"
              element={<ProtectedRoute roles={['ADMIN']}><AdminDashboard /></ProtectedRoute>} />

            {/* ── SARC Officer-only ── */}
            <Route path="/sarc-dashboard"
              element={<ProtectedRoute roles={['SARC_OFFICER', 'ADMIN']}><SarcOfficerDashboard /></ProtectedRoute>} />

            {/* ── Shared (patient + doctor) ── */}
            <Route path="/chat/:id"
              element={<ProtectedRoute roles={['PATIENT', 'DOCTOR']}><ChatRoom /></ProtectedRoute>} />
            <Route path="/consult/:id"
              element={<ProtectedRoute roles={['PATIENT', 'DOCTOR']}><VideoConsultation /></ProtectedRoute>} />

            {/* ── Any authenticated user ── */}
            <Route path="/safe-haven"             element={<ProtectedRoute><SafeHaven /></ProtectedRoute>} />
            <Route path="/safe-haven/evidence-guide" element={<ProtectedRoute><EvidenceGuide /></ProtectedRoute>} />
            <Route path="/safe-haven/legal-rights"   element={<ProtectedRoute><LegalRights /></ProtectedRoute>} />
            <Route path="/sarc"                   element={<ProtectedRoute><Sarc /></ProtectedRoute>} />
            <Route path="/sexual-health"          element={<ProtectedRoute><SexualHealth /></ProtectedRoute>} />
            <Route path="/mental-wellness"        element={<ProtectedRoute><MentalWellness /></ProtectedRoute>} />
            <Route path="/profile"                element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/settings"               element={<ProtectedRoute><Settings /></ProtectedRoute>} />
          </Route>

          {/* ── Fallback ── */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </AnimatePresence>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────
export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <GlobalModals />
        <AuthProvider>
          <SocketProvider>
            <ToastProvider>
              <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || ''}>
                <InnerRoutes />
              </GoogleOAuthProvider>
            </ToastProvider>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
