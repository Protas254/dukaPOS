import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';

/**
 * Route guard that only allows admin users through.
 * Cashiers (role === 'user') are redirected to the dashboard.
 */
export default function AdminRoute() {
  const { user, isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  const adminRoles = ['admin', 'manager', 'supervisor'];
  if (!adminRoles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
