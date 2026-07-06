import { useEffect, useState, useCallback } from "react";
import { adminGetFailedJobs, adminRetryFailedJob } from "../../services/api";
import { RefreshCw, Activity, AlertCircle } from "lucide-react";

export default function SystemHealth() {
  const [failedJobs, setFailedJobs] = useState<any[]>([]);

  const fetchJobs = useCallback(async () => {
    try {
      const data = await adminGetFailedJobs();
      setFailedJobs(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

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

  return (
    <div>
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ background: "#FEE2E2", padding: "12px", borderRadius: "12px", color: "#EF4444" }}>
          <Activity size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>System Health</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Monitor platform health, background tasks, and system events.</p>
        </div>
      </div>

      <div style={{ marginBottom: "24px" }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
          <AlertCircle size={18} color="#EF4444" />
          Failed Background Jobs
        </h2>
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
                <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>No failed jobs found. All systems operational.</td></tr>
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
      </div>
    </div>
  );
}
