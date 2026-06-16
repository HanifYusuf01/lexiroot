export type AppRole = 'user' | 'admin' | 'instructor';

/** Roles allowed to sign into the admin dashboard at all. */
export function isDashboardRole(role: AppRole | undefined | null): boolean {
  return role === 'admin' || role === 'instructor';
}

/** Account self-service pages available to every dashboard role. */
const ACCOUNT_PATHS = ['/manage-account', '/change-password'];

/**
 * Instructors are limited to the Overview, Lessons and Cultural Content
 * sections, plus their own account pages. Admins can reach everything.
 * Anything not listed here is admin-only.
 */
export function canAccessPath(role: AppRole | undefined | null, pathname: string): boolean {
  if (role === 'admin') return true;
  if (role !== 'instructor') return false;
  if (pathname === '/') return true;
  if (ACCOUNT_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`))) return true;
  return pathname.startsWith('/lessons') || pathname.startsWith('/cultural-content');
}
