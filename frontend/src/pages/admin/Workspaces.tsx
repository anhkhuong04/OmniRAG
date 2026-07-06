import { useEffect, useState, useCallback } from "react";
import { adminGetWorkspaces } from "../../services/api";
import { Briefcase, Eye, Search } from "lucide-react";

export default function Workspaces() {
  const [workspaces, setWorkspaces] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await adminGetWorkspaces();
      setWorkspaces(data.items || data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWorkspaces();
  }, [fetchWorkspaces]);

  return (
    <div>
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ background: "#E0E7FF", padding: "12px", borderRadius: "12px", color: "#4F46E5" }}>
            <Briefcase size={24} />
          </div>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Global Workspaces</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Platform-level overview of all customer workspaces.</p>
          </div>
        </div>
        
        <div style={{ position: "relative" }}>
          <Search size={18} color="#9CA3AF" style={{ position: "absolute", left: "12px", top: "10px" }} />
          <input 
            type="text" 
            placeholder="Search workspaces..." 
            style={{ 
              padding: "8px 12px 8px 36px", 
              borderRadius: "8px", 
              border: "1px solid #D1D5DB",
              outline: "none",
              width: "250px"
            }}
          />
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
          <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
            <tr>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Workspace Name</th>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Tenant ID</th>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Status</th>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Created At</th>
              <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>Loading...</td></tr>
            ) : workspaces.length === 0 ? (
              <tr><td colSpan={5} style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>No workspaces found.</td></tr>
            ) : (
              workspaces.map(w => (
                <tr key={w.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 500, color: "#111827" }}>{w.name}</td>
                  <td style={{ padding: "16px 24px", color: "#6B7280", fontSize: "13px" }}>{w.tenant_id}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <span style={{
                      padding: "4px 10px",
                      borderRadius: "9999px",
                      fontSize: "12px",
                      fontWeight: 500,
                      background: w.is_active ? "#DEF7EC" : "#FDE8E8",
                      color: w.is_active ? "#03543F" : "#9B1C1C",
                    }}>
                      {w.is_active ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td style={{ padding: "16px 24px", color: "#6B7280" }}>{new Date(w.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <button className="btn-secondary" style={{ padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                      <Eye size={14} /> Metadata
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
