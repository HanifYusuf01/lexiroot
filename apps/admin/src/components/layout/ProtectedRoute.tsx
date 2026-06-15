import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';
import { canAccessPath, isDashboardRole } from '../../utils/permissions';

export function ProtectedRoute() {
  const { token, user } = useAppSelector((s) => s.auth);
  const location = useLocation();

  if (!token) return <Navigate to="/login" replace />;

  if (user && !isDashboardRole(user.role)) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-2xl font-extrabold text-error">Not authorized</h1>
          <p className="mt-2 text-sm text-neutral-variant">
            Your account doesn&apos;t have dashboard access.
          </p>
        </div>
      </div>
    );
  }

  // Instructors can only reach a subset of routes; send them home otherwise.
  if (user && !canAccessPath(user.role, location.pathname)) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}
