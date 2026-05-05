import { Navigate, Outlet } from 'react-router-dom';
import { useAppSelector } from '../../store/hooks';

export function ProtectedRoute() {
  const { token, user } = useAppSelector((s) => s.auth);
  if (!token) return <Navigate to="/login" replace />;
  if (user && user.role !== 'admin') {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="max-w-sm text-center">
          <h1 className="font-display text-2xl font-extrabold text-error">Not authorized</h1>
          <p className="mt-2 text-sm text-neutral-variant">
            Your account doesn&apos;t have admin access.
          </p>
        </div>
      </div>
    );
  }
  return <Outlet />;
}
