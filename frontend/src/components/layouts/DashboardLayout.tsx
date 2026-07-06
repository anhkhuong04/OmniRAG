import React from "react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Key,
  MessageSquare,
  Code,
  Users,
  Shield,
  Activity,
  FileText,
  LogOut,
  ChevronLeft,
  Settings,
  Moon,
  Sun,
  MoreVertical,
  User as UserIcon,
  Briefcase,
  HeartPulse
} from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const location = useLocation();
  const path = location.pathname;

  const [isUserMenuOpen, setIsUserMenuOpen] = React.useState(false);

  // Close menu when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (!(e.target as Element).closest('.user-menu-container')) {
        setIsUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const isSystemAdmin = path.startsWith("/admin");
  const isApp = path.startsWith("/app") && !path.startsWith("/app/analytics");
  const isAnalytics = path.startsWith("/app/analytics");

  // Define sidebar links based on route prefix
  let navLinks: { label: string; to: string; icon: React.ReactNode }[] = [];

  if (isSystemAdmin && user?.is_system_admin) {
    navLinks = [
      { label: "Dashboard", to: "/admin/dashboard", icon: <LayoutDashboard size={20} /> },
      { label: "Tenants", to: "/admin/tenants", icon: <Users size={20} /> },
      { label: "Workspaces", to: "/admin/workspaces", icon: <Briefcase size={20} /> },
      { label: "Plans", to: "/admin/plans", icon: <BookOpen size={20} /> },
      { label: "Usage & Quota", to: "/admin/usage", icon: <Activity size={20} /> },
      { label: "System Health", to: "/admin/health", icon: <HeartPulse size={20} /> },
      { label: "Audit Logs", to: "/admin/logs", icon: <FileText size={20} /> },
      { label: "Settings", to: "/admin/settings", icon: <Settings size={20} /> },
    ];
  } else if (isApp) {
    navLinks = [
      { label: "Overview", to: "/app/overview", icon: <LayoutDashboard size={20} /> },
      { label: "Knowledge Base", to: "/app/knowledge", icon: <BookOpen size={20} /> },
      { label: "Chat Playground", to: "/app/playground", icon: <MessageSquare size={20} /> },
      { label: "API Keys", to: "/app/apikeys", icon: <Key size={20} /> },
      { label: "Widget", to: "/app/widget", icon: <Code size={20} /> },
    ];
  } else if (isAnalytics) {
    navLinks = [
      { label: "Analytics Overview", to: "/app/analytics/overview", icon: <Activity size={20} /> },
      // Other readonly modules can be added here
    ];
  }

  const NavItem = ({ label, to, icon }: { label: string; to: string; icon: React.ReactNode }) => {
    const active = path.startsWith(to);
    return (
      <Link
        to={to}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "12px",
          padding: "12px 16px",
          borderRadius: "8px",
          color: active ? "var(--accent-primary)" : "var(--text-body)",
          background: active ? "var(--color-bg-soft)" : "transparent",
          textDecoration: "none",
          fontWeight: active ? 600 : 500,
          transition: "all 0.2s ease",
          marginBottom: "4px"
        }}
      >
        {icon}
        {label}
      </Link>
    );
  };

  return (
    <div style={{ display: "flex", height: "100vh", overflow: "hidden", background: "var(--bg-primary)" }}>
      {/* Sidebar */}
      <aside style={{
        width: "260px",
        borderRight: "1px solid var(--color-border)",
        display: "flex",
        flexDirection: "column",
        background: "var(--color-bg)"
      }}>
        {/* Sidebar Header */}
        <div style={{ padding: "24px 20px", display: "flex", alignItems: "center", gap: "12px" }}>
          <img src="/logo.svg" alt="Logo" style={{ width: "32px", height: "32px" }} />
          <h2 style={{ fontSize: "20px", margin: 0, fontWeight: 700, color: "var(--text-heading)" }}>OmniRAG</h2>
        </div>

        {/* Workspace Switcher / Context */}
        <div style={{ padding: "0 20px 16px" }}>
          {user?.is_system_admin ? (
            <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "var(--danger, #EF4444)", padding: "8px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
              <Shield size={16} /> Platform Admin
            </div>
          ) : (
            <Link to="/workspaces" style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--text-muted)", fontSize: "12px", textDecoration: "none" }}>
              <ChevronLeft size={16} /> Switch Workspace
            </Link>
          )}
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: "0 12px", overflowY: "auto" }}>
          <div style={{ fontSize: "11px", textTransform: "uppercase", color: "var(--text-muted)", fontWeight: 700, letterSpacing: "1px", margin: "16px 8px 8px" }}>
            Menu
          </div>
          {navLinks.map(link => (
            <NavItem key={link.to} {...link} />
          ))}

        </nav>

        {/* Sidebar Footer */}
        <div className="user-menu-container" style={{ padding: "16px", borderTop: "1px solid var(--color-border)", position: "relative" }}>
          
          {isUserMenuOpen && (
            <div style={{
              position: "absolute",
              bottom: "100%",
              left: "16px",
              right: "16px",
              marginBottom: "8px",
              background: "var(--color-card)",
              backdropFilter: "blur(12px)",
              WebkitBackdropFilter: "blur(12px)",
              border: "1px solid var(--color-border)",
              borderRadius: "12px",
              padding: "8px",
              boxShadow: "0 10px 25px -5px rgba(0,0,0,0.2)",
              display: "flex",
              flexDirection: "column",
              gap: "4px",
              zIndex: 50
            }}>
              <div style={{ padding: "8px 12px", borderBottom: "1px solid var(--color-border)", marginBottom: "4px" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--color-text-main)" }}>{user?.full_name}</div>
                <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{user?.email}</div>
              </div>
              
              <button className="user-menu-btn" onClick={() => { setIsUserMenuOpen(false); /* Add settings routing */ }}>
                <Settings size={16} /> Profile Settings
              </button>
              
              <button className="user-menu-btn" onClick={() => { toggleTheme(); setIsUserMenuOpen(false); }}>
                {theme === 'dark' ? <><Sun size={16} /> Light Mode</> : <><Moon size={16} /> Dark Mode</>}
              </button>
              
              <button className="user-menu-btn text-danger" onClick={logout} style={{ color: "var(--color-danger, #EF4444)" }}>
                <LogOut size={16} /> Log Out
              </button>
            </div>
          )}

          <div 
            onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
            style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "space-between",
              padding: "8px",
              borderRadius: "8px",
              cursor: "pointer",
              transition: "background 0.2s",
              background: isUserMenuOpen ? "var(--color-bg-soft)" : "transparent"
            }}
            onMouseOver={(e) => e.currentTarget.style.background = "var(--color-bg-soft)"}
            onMouseOut={(e) => e.currentTarget.style.background = isUserMenuOpen ? "var(--color-bg-soft)" : "transparent"}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px", overflow: "hidden" }}>
              <div style={{ 
                width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-primary)", 
                display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" 
              }}>
                <UserIcon size={18} />
              </div>
              <div style={{ overflow: "hidden" }}>
                <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-heading)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.full_name}</div>
                <div style={{ fontSize: "12px", color: "var(--text-muted)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
              </div>
            </div>
            <MoreVertical size={16} color="var(--text-muted)" />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main style={{ flex: 1, overflowY: "auto", position: "relative" }}>
        {/* Optional Topbar for extra actions like Search/Notifications can go here */}
        <div style={{ padding: "32px 48px" }}>
          <Outlet />
        </div>
      </main>
    </div>
  );
}
