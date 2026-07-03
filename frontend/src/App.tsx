import { Routes, Route, Link, Outlet } from 'react-router-dom';
import AdminPage from './pages/AdminPage';
import TenantDashboard from './pages/TenantDashboard';
import LandingPage from './pages/LandingPage';

function DashboardLayout() {
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
          <div style={{
            width: '32px', height: '32px', borderRadius: '8px', 
            backgroundColor: 'var(--accent-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'white', fontWeight: 'bold'
          }}>
            O
          </div>
          <Link to="/" style={{ color: 'inherit', textDecoration: 'none' }}>
            <h2 style={{ fontSize: '18px', margin: 0 }}>OmniRAG</h2>
          </Link>
        </div>
        <nav style={{ display: 'flex', gap: 'var(--spacing-md)' }}>
          <Link to="/dashboard" style={{ color: 'var(--text-body)', fontWeight: 500 }} className="transition-colors">Tenant Dashboard</Link>
          <Link to="/admin" style={{ color: 'var(--text-body)', fontWeight: 500 }} className="transition-colors">Admin Panel</Link>
        </nav>
      </header>
      <main className="main-content">
        <Outlet />
      </main>
    </>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route element={<DashboardLayout />}>
        <Route path="/dashboard" element={<TenantDashboard />} />
        <Route path="/admin" element={<AdminPage />} />
      </Route>
    </Routes>
  );
}

export default App;
