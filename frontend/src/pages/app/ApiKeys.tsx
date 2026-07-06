import React, { useEffect, useState, useCallback } from "react";
import { Key, Plus, Trash2 } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { listWorkspaceApiKeys, createWorkspaceApiKey, revokeWorkspaceApiKey } from "../../services/api";
import type { WorkspaceAPIKeyResponse } from "../../services/api";

export default function ApiKeys() {
  const { currentWorkspaceId } = useAuth();
  const [apiKeys, setApiKeys] = useState<WorkspaceAPIKeyResponse[]>([]);
  const [newKeyName, setNewKeyName] = useState("");
  const [newRawKey, setNewRawKey] = useState("");

  const refreshApiKeys = useCallback(async () => {
    if (!currentWorkspaceId) return;
    try {
      const keys = await listWorkspaceApiKeys(currentWorkspaceId);
      setApiKeys(keys);
    } catch (err) {
      console.error("Failed to load API keys", err);
    }
  }, [currentWorkspaceId]);

  useEffect(() => {
    refreshApiKeys();
  }, [refreshApiKeys]);

  const handleCreateKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentWorkspaceId || !newKeyName) return;
    try {
      const res = await createWorkspaceApiKey(currentWorkspaceId, newKeyName);
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
      await revokeWorkspaceApiKey(currentWorkspaceId!, keyId);
      refreshApiKeys();
    } catch (err) {
      console.error("Failed to revoke key", err);
    }
  };

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>API Keys</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Manage API keys used to authenticate your application with the OmniRAG API.</p>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
          <div style={{ padding: "20px 24px", borderBottom: "1px solid #E5E7EB", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600 }}>Active Keys</h3>
          </div>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px", textAlign: "left" }}>
            <thead style={{ background: "#F9FAFB", borderBottom: "1px solid #E5E7EB" }}>
              <tr>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Name</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Key Prefix</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Created</th>
                <th style={{ padding: "12px 24px", fontWeight: 600, color: "#6B7280" }}>Action</th>
              </tr>
            </thead>
            <tbody>
              {apiKeys.map(k => (
                <tr key={k.id} style={{ borderBottom: "1px solid #E5E7EB" }}>
                  <td style={{ padding: "16px 24px", fontWeight: 500, color: "#111827" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Key size={16} color="#9CA3AF" /> {k.name}
                    </div>
                  </td>
                  <td style={{ padding: "16px 24px", fontFamily: "monospace", color: "#6B7280" }}>omnirag_{k.key_prefix}...</td>
                  <td style={{ padding: "16px 24px", color: "#6B7280" }}>{new Date(k.created_at).toLocaleDateString()}</td>
                  <td style={{ padding: "16px 24px" }}>
                    <button 
                      onClick={() => handleRevokeKey(k.id)}
                      style={{ color: "#EF4444", background: "transparent", border: "none", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <Trash2 size={16} /> Revoke
                    </button>
                  </td>
                </tr>
              ))}
              {apiKeys.length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: "24px", textAlign: "center", color: "#6B7280" }}>No API keys found. Create one to get started.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {newRawKey && (
          <div style={{ background: "#ECFDF5", border: "1px solid #10B981", padding: "16px", borderRadius: "12px" }}>
            <h4 style={{ margin: "0 0 8px 0", color: "#047857" }}>Key created successfully!</h4>
            <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#065F46" }}>Please copy this key now. You won't be able to see it again.</p>
            <code style={{ background: "#fff", padding: "8px 12px", borderRadius: "8px", border: "1px solid #A7F3D0", display: "block", wordBreak: "break-all", fontWeight: 600, color: "#064E3B" }}>
              {newRawKey}
            </code>
          </div>
        )}

        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "24px", maxWidth: "500px" }}>
          <h3 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600 }}>Create New API Key</h3>
          <form onSubmit={handleCreateKey} style={{ display: "flex", gap: "12px" }}>
            <input 
              required
              type="text" 
              className="input"
              placeholder="e.g. Production Key"
              value={newKeyName}
              onChange={e => setNewKeyName(e.target.value)}
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn-primary" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Plus size={18} /> Create Key
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
