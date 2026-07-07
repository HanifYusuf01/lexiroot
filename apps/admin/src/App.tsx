import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuthBootstrap } from './hooks/useAuthBootstrap';
import { useAppSelector } from './store/hooks';
import { AdminLayout } from './components/layout/AdminLayout';
import { PageHeader } from './components/layout/PageHeader';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { ActivityLogPage } from './pages/ActivityLogPage';
import { AdminManagementPage } from './pages/AdminManagementPage';
import { AnalyticsPage } from './pages/AnalyticsPage';
import { RevenueAnalyticsPage } from './pages/RevenueAnalyticsPage';
import { ChangePasswordPage } from './pages/ChangePasswordPage';
import { CulturalContentEditorPage } from './pages/CulturalContentEditorPage';
import { CulturalContentPage } from './pages/CulturalContentPage';
import { GamificationPage } from './pages/GamificationPage';
import { LessonEditorPage } from './pages/LessonEditorPage';
import { LessonsPage } from './pages/LessonsPage';
import { LoginPage } from './pages/LoginPage';
import { ManageAccountPage } from './pages/ManageAccountPage';
import { OverviewPage } from './pages/OverviewPage';
import { RegisterPage } from './pages/RegisterPage';
import { SettingsPage } from './pages/SettingsPage';
import { SubscriptionsPage } from './pages/SubscriptionsPage';
import { TopXpEarnersPage } from './pages/TopXpEarnersPage';
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
      <Route path="/register" element={<RegisterPage />} />
      {/* Hosted-checkout return pages live on the marketing website (apps/web),
          not here — see apps/web/src/pages/SubscriptionReturn.tsx. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<AdminLayout />}>
          <Route path="/" element={<OverviewPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/lessons" element={<LessonsPage />} />
          <Route path="/lessons/new" element={<LessonEditorPage />} />
          <Route path="/lessons/:id/edit" element={<LessonEditorPage />} />
          <Route path="/analytics" element={<AnalyticsPage />} />
          <Route path="/analytics/revenue" element={<RevenueAnalyticsPage />} />
          <Route path="/subscriptions" element={<SubscriptionsPage />} />
          <Route path="/cultural-content" element={<CulturalContentPage />} />
          <Route path="/cultural-content/folktales" element={<CulturalContentPage />} />
          <Route path="/cultural-content/proverbs" element={<CulturalContentPage />} />
          <Route path="/cultural-content/stories" element={<CulturalContentPage />} />
          <Route path="/cultural-content/new" element={<CulturalContentEditorPage />} />
          <Route path="/cultural-content/:id/edit" element={<CulturalContentEditorPage />} />
          <Route path="/gamification" element={<GamificationPage />} />
          <Route path="/gamification/top-earners" element={<TopXpEarnersPage />} />
          <Route path="/reports" element={<ComingSoon title="Reports" />} />
          <Route path="/admin-management" element={<AdminManagementPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/manage-account" element={<ManageAccountPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route path="/activity-log" element={<ActivityLogPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
