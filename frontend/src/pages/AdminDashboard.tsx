import React, { useEffect, useState, useCallback } from "react";
import { 
  adminGetTenants, 
  adminDisableTenant, 
  adminEnableTenant, 
  adminGetSystemUsage, 
  adminGetFailedJobs, 
  adminRetryFailedJob, 
  adminGetAuditLogs,
  AdminSystemUsage,
  AdminAuditLog
} from "../services/api";
import { useAuth } from "../context/AuthContext";
import { Shield, Users, Activity, AlertCircle, RefreshCw, FileText } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"tenants" | "usage" | "jobs" | "audit">("tenants");

  // State
  const [tenants, setTenants] = useState<any[]>([]);
  const [usage, setUsage] = useState<AdminSystemUsage | null>(null);
  const [failedJobs, setFailedJobs] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // Fetch functions
  const fetchTenants = useCallback(async () => {
    try {
      const data = await adminGetTenants();
      setTenants(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    try {
      const data = await adminGetSystemUsage();
      setUsage(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await adminGetFailedJobs();
      setFailedJobs(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  const fetchAudit = useCallback(async () => {
    try {
      const data = await adminGetAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    if (activeTab === "tenants") fetchTenants();
    if (activeTab === "usage") fetchUsage();
    if (activeTab === "jobs") fetchJobs();
    if (activeTab === "audit") fetchAudit();
  }, [activeTab, fetchTenants, fetchUsage, fetchJobs, fetchAudit]);

  // Actions
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

  const handleRetryJob = async (id: string) => {
    try {
      await adminRetryFailedJob(id);
      alert("Job retried successfully.");
      fetchJobs();
    } catch (err) {
      alert("Retry failed.");
      console.error(err);
    }
  };

  if (!user?.is_system_admin) {
    return (
      <div className="container" style={{ padding: "64px 0", textAlign: "center", color: "#EF4444" }}>
        <Shield size={48} style={{ margin: "0 auto 16px" }} />
        <h2>Access Denied</h2>
        <p>You must be a System Administrator to view this page.</p>
      </div>
    );
  }

  const tabStyle = (isActive: boolean) => ({
    padding: "12px 24px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    color: isActive ? "var(--accent-primary)" : "#6B7280",
    borderBottom: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
    transition: "all 0.2s ease",
  });

  return (
    <div className="container" style={{ padding: "32px 0" }}>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", display: "flex", alignItems: "center", gap: "12px" }}>
          <Shield color="var(--accent-primary)" /> Super Admin Panel
        </h1>
        <p style={{ color: "#6B7280", marginTop: "8px" }}>Monitor and manage the entire OmniRAG platform infrastructure.</p>
      </div>

      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E5E7EB", marginBottom: "32px" }}>
        <div style={tabStyle(activeTab === "tenants")} onClick={() => setActiveTab("tenants")}>
          <Users size={18} /> Workspaces
        </div>
        <div style={tabStyle(activeTab === "usage")} onClick={() => setActiveTab("usage")}>
          <Activity size={18} /> System Usage
        </div>
        <div style={tabStyle(activeTab === "jobs")} onClick={() => setActiveTab("jobs")}>
          <AlertCircle size={18} /> Failed Jobs
        </div>
        <div style={tabStyle(activeTab === "audit")} onClick={() => setActiveTab("audit")}>
          <FileText size={18} /> Audit Logs
        </div>
      </div>

      {activeTab === "tenants" && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
            <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
              <tr>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Workspace ID</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Name</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Status</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Created</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {tenants.map(t => (
                <tr key={t.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "16px 24px", color: "#6B7280", fontSize: "12px" }}>{t.id}</td>
                  <td style={{ padding: "16px 24px", fontWeight: 500, color: "#111827" }}>{t.name}</td>
                  <td style={{ padding: "16px 24px" }}>
                    {t.is_active 
                      ? <span style={{ color: "#10B981", background: "#D1FAE5", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}>Active</span>
                      : <span style={{ color: "#EF4444", background: "#FEE2E2", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}>Disabled</span>
                    }
                  </td>
                  <td style={{ padding: "16px 24px", color: "#6B7280" }}>{new Date(t.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <button 
                      onClick={() => handleToggleTenant(t.id, t.is_active)}
                      className={t.is_active ? "btn-secondary" : "btn-primary"}
                      style={{ padding: "6px 12px", fontSize: "12px" }}
                    >
                      {t.is_active ? "Disable" : "Enable"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "usage" && usage && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: "24px" }}>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "14px", border: "1px solid #E5E7EB" }}>
            <div style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Total System Cost (USD)</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#111827" }}>${usage.total_cost_usd.toFixed(4)}</div>
          </div>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "14px", border: "1px solid #E5E7EB" }}>
            <div style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Total Embeddings / Queries</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#111827" }}>{usage.total_operations.toLocaleString()}</div>
          </div>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "14px", border: "1px solid #E5E7EB" }}>
            <div style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Total Prompt Tokens</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#111827" }}>{usage.total_prompt_tokens.toLocaleString()}</div>
          </div>
          <div style={{ background: "#fff", padding: "24px", borderRadius: "14px", border: "1px solid #E5E7EB" }}>
            <div style={{ color: "#6B7280", fontSize: "14px", fontWeight: 500, marginBottom: "8px" }}>Total Completion Tokens</div>
            <div style={{ fontSize: "36px", fontWeight: 700, color: "#111827" }}>{usage.total_completion_tokens.toLocaleString()}</div>
          </div>
        </div>
      )}

      {activeTab === "jobs" && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
            <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
              <tr>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Doc ID</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Filename</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Error Message</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Updated At</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {failedJobs.length === 0 && (
                <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>No failed jobs found.</td></tr>
              )}
              {failedJobs.map(j => (
                <tr key={j.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "16px 24px", color: "#6B7280", fontSize: "12px" }}>{j.id.slice(0,8)}...</td>
                  <td style={{ padding: "16px 24px", fontWeight: 500, color: "#111827" }}>{j.filename}</td>
                  <td style={{ padding: "16px 24px", color: "#EF4444" }}>{j.error_message}</td>
                  <td style={{ padding: "16px 24px", color: "#6B7280" }}>{new Date(j.updated_at).toLocaleString()}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <button 
                      onClick={() => handleRetryJob(j.id)}
                      className="btn-primary"
                      style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
                    >
                      <RefreshCw size={14} /> Retry
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === "audit" && (
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
            <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
              <tr>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Time</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Actor User ID</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Action</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Target Type</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Target ID</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.map(log => (
                <tr key={log.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "16px 24px", color: "#6B7280" }}>{new Date(log.created_at).toLocaleString()}</td>
                  <td style={{ padding: "16px 24px", color: "#6B7280", fontSize: "12px" }}>{log.actor_user_id}</td>
                  <td style={{ padding: "16px 24px", fontWeight: 600, color: "#111827" }}>{log.action}</td>
                  <td style={{ padding: "16px 24px", color: "#6B7280" }}>{log.target_type}</td>
                  <td style={{ padding: "16px 24px", color: "#6B7280", fontSize: "12px" }}>{log.target_id}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
