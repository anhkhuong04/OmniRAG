import React, { useState } from "react";
import { DocumentList } from "../../components/DocumentList";
import { useAuth } from "../../contexts/AuthContext";

export default function KnowledgeBase() {
  const { currentWorkspaceId } = useAuth();
  
  // To upload documents we need an API Key. We can try to fetch it automatically,
  // or prompt the user. For simplicity in the new shell, we assume they have a key or we use the JWT directly.
  // Wait, the DocumentList currently requires `apiKey`. We should probably get one from localstorage or fetch it.
  const [apiKey, setApiKey] = useState(localStorage.getItem("workspaceApiKey") || "");

  return (
    <div>
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Knowledge Base</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Upload and manage documents to build your RAG knowledge base.</p>
        </div>
        
        {/* Helper to set active API key for uploading directly from UI */}
        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Active API Key (for upload)</label>
          <input
            type="password"
            className="input"
            style={{ width: "240px", padding: "6px 12px", height: "auto" }}
            placeholder="Enter API Key to enable upload"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); localStorage.setItem("workspaceApiKey", e.target.value); }}
          />
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {currentWorkspaceId ? (
          <DocumentList apiKey={apiKey} onRefreshUsage={() => {}} />
        ) : (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            Please select a workspace first.
          </div>
        )}
      </div>
    </div>
  );
}
