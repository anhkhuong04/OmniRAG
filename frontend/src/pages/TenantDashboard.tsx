import React, { useEffect, useState, useCallback } from "react";
import {
  WorkspaceAPIKeyResponse,
  UsageStatsResponse,
  getWorkspaceUsage,
  getWorkspaceUsageHistory,
  listWorkspaceApiKeys,
  createWorkspaceApiKey,
  revokeWorkspaceApiKey,
  UsageHistoryResponse
} from "../services/api";
import { UsageOverview, UsageHistoryChart } from "../components/UsageStatsCard";
import { DocumentList } from "../components/DocumentList";
import ChatWidget from "../components/ChatWidget";
import { WidgetSettings } from "../components/WidgetSettings";
import { Key, Plus, Trash2, ShieldAlert } from "lucide-react";

export default function TenantDashboard() {
  const [activeTab, setActiveTab] = useState<"overview" | "documents" | "apikeys" | "chat" | "widget">("overview");

  // Global Tenant Context
  const [tenantId, setTenantId] = useState(localStorage.getItem("tenantId") || "");
  const [apiKey, setApiKey] = useState(localStorage.getItem("tenantApiKey") || "");

  const [usageStats, setUsageStats] = useState<UsageStatsResponse | null>(null);
  const [usageHistory, setUsageHistory] = useState<UsageHistoryResponse | null>(null);
  const [apiKeys, setApiKeys] = useState<WorkspaceAPIKeyResponse[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newRawKey, setNewRawKey] = useState("");

  const refreshUsage = useCallback(async () => {
    if (!tenantId) return;
    try {
      const stats = await getWorkspaceUsage(tenantId);
      setUsageStats(stats);
      
      const history = await getWorkspaceUsageHistory(tenantId);
      setUsageHistory(history);
    } catch (err) {
      console.error("Failed to load usage stats or history", err);
    }
  }, [tenantId]);

  const refreshApiKeys = useCallback(async () => {
    if (!tenantId) return;
    try {
      const keys = await listWorkspaceApiKeys(tenantId);
      setApiKeys(keys);
    } catch (err) {
      console.error("Failed to load API keys", err);
    }
  }, [tenantId]);

  useEffect(() => {
    refreshUsage();
    refreshApiKeys();
  }, [refreshUsage, refreshApiKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!tenantId || !newKeyName) return;
    try {
      const res = await createWorkspaceApiKey(tenantId, newKeyName);
      setNewRawKey(res.raw_key);
      setNewKeyName("");
      refreshApiKeys();
    } catch (err) {
      console.error("Failed to create key", err);
    }
  };

  const handleRevokeKey = async (keyId: string) => {
    if (!confirm("Are you sure you want to revoke this API key?")) return;
    try {
      await revokeWorkspaceApiKey(tenantId, keyId);
      refreshApiKeys();
    } catch (err) {
      console.error("Failed to revoke key", err);
    }
  };

  const tabStyle = (isActive: boolean) => ({
    padding: "12px 24px",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "14px",
    color: isActive ? "var(--accent-primary)" : "#6B7280",
    borderBottom: isActive ? "2px solid var(--accent-primary)" : "2px solid transparent",
    transition: "all 0.2s ease",
  });

  return (
    <div className="container" style={{ padding: "32px 0" }}>
      <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827" }}>Workspace Dashboard</h1>
        
        {/* Helper to set context for testing */}
        <div style={{ display: "flex", gap: "12px", background: "#fff", padding: "8px 16px", borderRadius: "12px", border: "1px solid #E5E7EB" }}>
          <input
            className="input"
            style={{ padding: "6px 12px", height: "auto" }}
            placeholder="Workspace ID (from url/db)"
            value={tenantId}
            onChange={(e) => { setTenantId(e.target.value); localStorage.setItem("tenantId", e.target.value); }}
          />
          <input
            type="password"
            className="input"
            style={{ padding: "6px 12px", height: "auto" }}
            placeholder="Active API Key"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); localStorage.setItem("tenantApiKey", e.target.value); }}
          />
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", gap: "8px", borderBottom: "1px solid #E5E7EB", marginBottom: "32px" }}>
        <div style={tabStyle(activeTab === "overview")} onClick={() => setActiveTab("overview")}>Overview</div>
        <div style={tabStyle(activeTab === "documents")} onClick={() => setActiveTab("documents")}>Documents</div>
        <div style={tabStyle(activeTab === "apikeys")} onClick={() => setActiveTab("apikeys")}>API Keys</div>
        <div style={tabStyle(activeTab === "chat")} onClick={() => setActiveTab("chat")}>Chat Playground</div>
        <div style={tabStyle(activeTab === "widget")} onClick={() => setActiveTab("widget")}>Widget Integration</div>
      </div>

      {/* Tab Content */}
      <div style={{ minHeight: "600px" }}>
        {activeTab === "overview" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>Usage & Quotas</h2>
            {usageStats ? <UsageOverview stats={usageStats} /> : <div>Loading stats...</div>}
            
            {usageHistory && <UsageHistoryChart history={usageHistory} />}
          </div>
        )}

        {activeTab === "documents" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>Knowledge Base</h2>
            <DocumentList apiKey={apiKey} onRefreshUsage={refreshUsage} />
          </div>
        )}

        {activeTab === "apikeys" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            <div>
              <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "16px" }}>API Keys</h2>
              <p style={{ color: "#6B7280", marginBottom: "24px" }}>Manage API keys used to authenticate your application with the OmniRAG API.</p>
              
              <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
                  <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
                    <tr>
                      <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Name</th>
                      <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Status</th>
                      <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Created</th>
                      <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280", width: "80px" }}></th>
                    </tr>
                  </thead>
                  <tbody>
                    {apiKeys.length === 0 && (
                      <tr><td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>No API keys found.</td></tr>
                    )}
                    {apiKeys.map(k => (
                      <tr key={k.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                        <td style={{ padding: "16px 24px", fontWeight: 500, color: "#111827" }}>{k.name}</td>
                        <td style={{ padding: "16px 24px" }}>
                          {k.is_active 
                            ? <span style={{ color: "#10B981", background: "#D1FAE5", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}>Active</span>
                            : <span style={{ color: "#6B7280", background: "#F3F4F6", padding: "2px 8px", borderRadius: "12px", fontSize: "12px", fontWeight: 500 }}>Revoked</span>
                          }
                        </td>
                        <td style={{ padding: "16px 24px", color: "#6B7280" }}>{new Date(k.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "16px 24px", textAlign: "right" }}>
                          {k.is_active && (
                            <button onClick={() => handleRevokeKey(k.id)} style={{ background: "none", border: "none", color: "#EF4444", cursor: "pointer" }} title="Revoke">
                              <Trash2 size={18} />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div style={{ background: "#F9FAFB", padding: "24px", borderRadius: "14px", border: "1px dashed #D1D5DB" }}>
              <h3 style={{ fontSize: "16px", fontWeight: 600, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <Key size={18} /> Create New API Key
              </h3>
              <form onSubmit={handleCreateKey} style={{ display: "flex", gap: "12px", alignItems: "flex-end" }}>
                <div style={{ flex: 1 }}>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: 500, marginBottom: "6px" }}>Key Name</label>
                  <input
                    required
                    className="input"
                    placeholder="e.g., Production Frontend"
                    value={newKeyName}
                    onChange={e => setNewKeyName(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Plus size={16} /> Create
                </button>
              </form>

              {newRawKey && (
                <div style={{ marginTop: "24px", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "8px", padding: "16px" }}>
                  <div style={{ display: "flex", gap: "12px", color: "#991B1B" }}>
                    <ShieldAlert size={24} />
                    <div>
                      <div style={{ fontWeight: 600, marginBottom: "4px" }}>Save your API Key</div>
                      <div style={{ fontSize: "14px", marginBottom: "12px" }}>This is the only time it will be shown. Please copy it now.</div>
                      <code style={{ background: "#fff", padding: "8px 12px", borderRadius: "6px", border: "1px solid #FCA5A5", display: "block", wordBreak: "break-all" }}>
                        {newRawKey}
                      </code>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "chat" && (
          <div>
            <h2 style={{ fontSize: "20px", fontWeight: 600, marginBottom: "24px" }}>Chat Playground</h2>
            <div style={{ height: "600px", maxWidth: "800px", margin: "0 auto" }}>
              {!apiKey ? (
                <div style={{ textAlign: "center", padding: "64px", background: "#F9FAFB", borderRadius: "14px", border: "1px dashed #D1D5DB" }}>
                  Please set your Active API Key in the top right to use the playground.
                </div>
              ) : (
                <ChatWidget apiKey={apiKey} />
              )}
            </div>
          </div>
        )}

        {activeTab === "widget" && (
          <div>
            <WidgetSettings apiKey={apiKey} />
          </div>
        )}
      </div>
    </div>
  );
}
