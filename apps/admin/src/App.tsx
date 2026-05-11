import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthBootstrap } from './hooks/useAuthBootstrap';
import { useAppSelector } from './store/hooks';
import { AdminLayout } from './components/layout/AdminLayout';
import { PageHeader } from './components/layout/PageHeader';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { LessonEditorPage } from './pages/LessonEditorPage';
import { LessonsPage } from './pages/LessonsPage';
import { LoginPage } from './pages/LoginPage';
import { ManageAccountPage } from './pages/ManageAccountPage';
import { OverviewPage } from './pages/OverviewPage';
import { UsersPage } from './pages/UsersPage';

function ComingSoon({ title }: { title: string }) {
  return (
    <div className="space-y-6">
      <PageHeader title={title} subtitle="Coming soon." />
    </div>
  );
}

export function App() {
  useAuthBootstrap();
  const { hydrated, token } = useAppSelector((s) => s.auth);

  if (!hydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-soft">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={token ? <Navigate to="/" replace /> : <LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/lessons/new" element={<LessonEditorPage />} />
          <Route path="/lessons/:id/edit" element={<LessonEditorPage />} />
          <Route path="/analytics" element={<ComingSoon title="Analytics" />} />
          <Route path="/cultural-content" element={<ComingSoon title="Cultural Content" />} />
          <Route path="/gamification" element={<ComingSoon title="Gamification" />} />
          <Route path="/subscription" element={<ComingSoon title="Subscription" />} />
          <Route path="/reports" element={<ComingSoon title="Reports" />} />
          <Route path="/settings" element={<ComingSoon title="Settings" />} />
          <Route path="/manage-account" element={<ManageAccountPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/activity-log" element={<ActivityLogPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
