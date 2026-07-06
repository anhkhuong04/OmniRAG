import React, { useEffect, useState, useCallback } from "react";
import { adminGetAuditLogs } from "../../services/api";
import type { AdminAuditLog } from "../../services/api";

export default function AuditLogs() {
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  const fetchAudit = useCallback(async () => {
    try {
      const data = await adminGetAuditLogs();
      setAuditLogs(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchAudit();
  }, [fetchAudit]);

  const getActionColor = (action: string) => {
    if (action.includes("impersonate")) return "var(--color-warning, #F59E0B)";
    if (action.includes("disable")) return "var(--color-danger, #EF4444)";
    if (action.includes("enable")) return "var(--color-success, #10B981)";
    if (action.includes("update")) return "var(--color-primary, #3B82F6)";
    return "var(--color-text-main)";
  };

  return (
    <div className="admin-page">
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "var(--color-text-main)", marginBottom: "8px", letterSpacing: "-0.02em" }}>System Audit Logs</h1>
        <p style={{ color: "var(--color-text-muted)", fontSize: "15px", margin: 0 }}>Traceability for all administrative actions on the platform.</p>
      </div>

      <div className="admin-glass-panel">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Actor User ID</th>
              <th>Action</th>
              <th>Target Type</th>
              <th>Target ID</th>
            </tr>
          </thead>
          <tbody>
            {auditLogs.map(log => (
              <tr key={log.id}>
                <td style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>{new Date(log.created_at).toLocaleString()}</td>
                <td style={{ color: "var(--color-text-light)", fontSize: "12px", fontFamily: "monospace" }}>{log.actor_user_id}</td>
                <td style={{ fontWeight: 600, color: getActionColor(log.action), fontFamily: "monospace", fontSize: "13px" }}>{log.action}</td>
                <td style={{ color: "var(--color-text-muted)", fontSize: "13px" }}>{log.target_type}</td>
                <td style={{ color: "var(--color-text-light)", fontSize: "12px", fontFamily: "monospace" }}>{log.target_id || "-"}</td>
              </tr>
            ))}
            {auditLogs.length === 0 && (
              <tr><td colSpan={5} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-muted)" }}>No audit logs found.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
