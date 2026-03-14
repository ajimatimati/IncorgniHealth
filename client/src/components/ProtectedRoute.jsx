/**
 * ProtectedRoute.jsx
 *
 * Blocks access to a route if the authenticated user's role
 * doesn't match the allowed roles list. Unauthenticated users
 * are sent back to /auth. Wrong-role users are sent to their
 * own dashboard.
 */
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Map each role to its home dashboard
const ROLE_HOME = {
  PATIENT:     '/dashboard',
  DOCTOR:      '/doctor-dashboard',
  PHARMACY:    '/pharmacy-dashboard',
  RIDER:       '/rider-dashboard',
  ADMIN:       '/admin',
  LAB_SCIENTIST: '/dashboard',
  SARC_OFFICER:  '/dashboard',
};

/**
 * @param {string[]} roles - allowed role strings, e.g. ['DOCTOR', 'ADMIN']
 * @param {ReactNode} children
 */
function ProtectedRoute({ roles = [], children }) {
  const { isAuthenticated, loading, user } = useAuth();

  // Still resolving auth state — render nothing to avoid a flash
  if (loading) return null;

  // Not logged in at all
  if (!isAuthenticated || !user) {
    return <Navigate to="/auth" replace />;
  }

  // Logged in but wrong role
  if (roles.length > 0 && !roles.includes(user.role)) {
    const home = ROLE_HOME[user.role] || '/dashboard';
    return <Navigate to={home} replace />;
  }

  return children;
}

export default ProtectedRoute;
