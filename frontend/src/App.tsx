import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';

// Layouts
import DashboardLayout from './components/layouts/DashboardLayout';

// Public Pages
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import WorkspaceCreatePage from './pages/WorkspaceCreatePage';
import WidgetPage from './pages/WidgetPage';

// App Pages (Tenant)
import Overview from './pages/app/Overview';
import KnowledgeBase from './pages/app/KnowledgeBase';
import ChatPlayground from './pages/app/ChatPlayground';
import ApiKeys from './pages/app/ApiKeys';
import WidgetIntegration from './pages/app/WidgetIntegration';

// Admin Pages (System)
import AdminDashboard from './pages/admin/Dashboard';
import Tenants from './pages/admin/Tenants';
import Plans from './pages/admin/Plans';
import SystemUsage from './pages/admin/SystemUsage';

import AuditLogs from './pages/admin/AuditLogs';
import ImpersonateInit from './pages/admin/ImpersonateInit';
import Workspaces from './pages/admin/Workspaces';
import SystemHealth from './pages/admin/SystemHealth';
import Settings from './pages/admin/Settings';

// ─── Public-only route (redirect if already logged in) ────────────────────────

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) {
    if (user.is_system_admin) {
      return <Navigate to="/admin/tenants" replace />;
    }
    return <Navigate to="/workspaces" replace />;
  }
  return <>{children}</>;
}

// ─── Workspaces redirect — sends to /app/overview or /workspaces/new ──────────

function WorkspacesRedirect() {
  const { currentWorkspaceId } = useAuth();
  if (currentWorkspaceId) return <Navigate to="/app/overview" replace />;
  return <Navigate to="/workspaces/new" replace />;
}

// ─── App ──────────────────────────────────────────────────────────────────────

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/widget/:token" element={<WidgetPage />} />
      <Route path="/login" element={
        <PublicRoute>
          <LoginPage />
        </PublicRoute>
      } />

      {/* Auth flow routes (require login but not workspace) */}
      <Route path="/verify-email" element={
        <ProtectedRoute requireWorkspaceUser>
          <VerifyEmailPage />
        </ProtectedRoute>
      } />
      <Route path="/workspaces/new" element={
        <ProtectedRoute requireVerified requireWorkspaceUser>
          <WorkspaceCreatePage />
        </ProtectedRoute>
      } />
      <Route path="/workspaces" element={
        <ProtectedRoute requireWorkspaceUser>
          <WorkspacesRedirect />
        </ProtectedRoute>
      } />

      {/* Protected app routes (Workspace Shell) */}
      <Route path="/app" element={
        <ProtectedRoute requireWorkspaceUser>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="overview" replace />} />
        <Route path="overview" element={<Overview />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="playground" element={<ChatPlayground />} />
        <Route path="apikeys" element={<ApiKeys />} />
        <Route path="widget" element={<WidgetIntegration />} />
        
        {/* Placeholder for Analytics Viewer Role */}
        <Route path="analytics/overview" element={<Overview />} />
      </Route>

      {/* Protected admin routes (System Admin Shell) */}
      <Route path="/admin" element={
        <ProtectedRoute requireAdmin>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="tenants" element={<Tenants />} />
        <Route path="workspaces" element={<Workspaces />} />
        <Route path="plans" element={<Plans />} />
        <Route path="usage" element={<SystemUsage />} />
        <Route path="health" element={<SystemHealth />} />
        <Route path="logs" element={<AuditLogs />} />
        <Route path="settings" element={<Settings />} />
      </Route>
      
      {/* Admin specific standalone routes */}
      <Route path="/impersonate-init" element={<ImpersonateInit />} />

      {/* Legacy fallbacks */}
      <Route path="/dashboard" element={<Navigate to="/app/overview" replace />} />
      <Route path="/system-admin" element={<Navigate to="/admin/tenants" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}
