import { Routes, Route, Link, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AdminPage from './pages/AdminPage';
import TenantDashboard from './pages/TenantDashboard';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import WorkspaceCreatePage from './pages/WorkspaceCreatePage';
import WidgetPage from './pages/WidgetPage';
import AdminDashboard from './pages/AdminDashboard';

// ─── Dashboard Layout (shown when user is logged in) ─────────────────────────

function DashboardLayout() {
  const { user, logout } = useAuth();
  return (
    <>
      <header style={{ 
        borderBottom: '1px solid var(--border-color)', 
        padding: 'var(--spacing-md) var(--spacing-lg)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        backgroundColor: 'var(--bg-primary)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
          <img src="/logo.svg" alt="OmniRAG Logo" style={{ width: '32px', height: '32px' }} />
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            <h2 style={{ fontSize: '18px', margin: 0 }}>OmniRAG</h2>
          </Link>
        </div>
        <nav style={{ display: 'flex', gap: 'var(--spacing-md)', alignItems: 'center' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-body)', fontWeight: 500 }} className="transition-colors">Dashboard</Link>
          <Link to="/admin" style={{ color: 'var(--text-body)', fontWeight: 500 }} className="transition-colors">Dev Admin</Link>
          {user?.is_system_admin && (
            <Link to="/system-admin" style={{ color: 'var(--accent-primary)', fontWeight: 600 }} className="transition-colors">Super Admin</Link>
          )}
          {user && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)' }}>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{user.email}</span>
              <button
                onClick={logout}
                style={{
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--border-color)',
                  borderRadius: 'var(--radius-sm)',
                  padding: '5px 12px',
                  fontSize: '13px',
                  cursor: 'pointer',
                  color: 'var(--text-body)',
                }}
              >
                Log out
              </button>
            </div>
          )}
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}

// ─── Public-only route (redirect if already logged in) ────────────────────────

function PublicRoute({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  if (isLoading) return null;
  if (user) return <Navigate to="/workspaces" replace />;
  return <>{children}</>;
}

// ─── Workspaces redirect — sends to /dashboard or /workspaces/new ─────────────

function WorkspacesRedirect() {
  const { currentWorkspaceId } = useAuth();
  if (currentWorkspaceId) return <Navigate to="/dashboard" replace />;
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
        <ProtectedRoute>
          <VerifyEmailPage />
        </ProtectedRoute>
      } />
      <Route path="/workspaces/new" element={
        <ProtectedRoute requireVerified>
          <WorkspaceCreatePage />
        </ProtectedRoute>
      } />
      <Route path="/workspaces" element={
        <ProtectedRoute>
          <WorkspacesRedirect />
        </ProtectedRoute>
      } />

      {/* Protected app routes (require auth) */}
      <Route element={
        <ProtectedRoute>
          <DashboardLayout />
        </ProtectedRoute>
      }>
        <Route path="/dashboard" element={<TenantDashboard />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route path="/system-admin" element={<AdminDashboard />} />
      </Route>
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
