import React, { useEffect, useState, useCallback } from "react";
import { adminGetTenants, adminDisableTenant, adminEnableTenant } from "../../services/api";

export default function Tenants() {
  const [tenants, setTenants] = useState<any[]>([]);

  const fetchTenants = useCallback(async () => {
    try {
      const data = await adminGetTenants();
      setTenants(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchTenants();
  }, [fetchTenants]);

  const handleToggleTenant = async (id: string, currentlyActive: boolean) => {
    if (!confirm(`Are you sure you want to ${currentlyActive ? 'DISABLE' : 'ENABLE'} this workspace?`)) return;
    try {
      if (currentlyActive) {
        await adminDisableTenant(id);
      } else {
        await adminEnableTenant(id);
      }
      fetchTenants();
    } catch (err) {
      alert("Action failed.");
      console.error(err);
    }
  };

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-main)", margin: "0 0 8px", letterSpacing: "-0.02em" }}>Workspaces</h1>
          <p style={{ color: "var(--color-text-muted)", fontSize: "15px", margin: 0 }}>Manage all workspaces and impersonate tenants for support.</p>
        </div>
      </div>

      <div className="admin-glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Workspace ID</th>
              <th>Name</th>
              <th>Status</th>
              <th>Created</th>
              <th style={{ textAlign: "right" }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tenants.map(t => (
              <tr key={t.id}>
                <td style={{ color: "var(--color-text-muted)", fontSize: "12px", fontFamily: "monospace" }}>{t.id}</td>
                <td style={{ fontWeight: 600, color: "var(--color-text-main)" }}>{t.name}</td>
                <td>
                  {t.is_active 
                    ? <span className="admin-badge admin-badge-success">Active</span>
                    : <span className="admin-badge admin-badge-danger">Disabled</span>
                  }
                </td>
                <td style={{ color: "var(--color-text-light)" }}>{new Date(t.created_at).toLocaleDateString()}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
                    <button 
                      onClick={() => handleToggleTenant(t.id, t.is_active)}
                      className="admin-btn admin-btn-outline"
                    >
                      {t.is_active ? "Disable" : "Enable"}
                    </button>
                    <button 
                      onClick={async () => {
                        if (!confirm("Enter read-only support mode for this workspace?")) return;
                        try {
                          const { adminImpersonateTenant } = await import("../../services/api");
                          const res = await adminImpersonateTenant(t.id);
                          window.open(`/impersonate-init?token=${res.access_token}&tenant_id=${res.impersonated_tenant_id}`, "_blank");
                        } catch (err) {
                          alert("Impersonation failed");
                        }
                      }}
                      className="admin-btn admin-btn-primary"
                    >
                      Impersonate
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tenants.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>No workspaces found.</td></tr>
            )}
          </tbody>
        </table>
      </div>

    </div>
  );
}
