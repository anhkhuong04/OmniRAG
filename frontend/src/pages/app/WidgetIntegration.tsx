import React, { useState } from "react";
import { WidgetSettings } from "../../components/WidgetSettings";
import { useAuth } from "../../contexts/AuthContext";

export default function WidgetIntegration() {
  const { currentWorkspaceId } = useAuth();
  const [apiKey, setApiKey] = useState(localStorage.getItem("workspaceApiKey") || "");

  return (
    <div>
      <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>Widget Integration</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Configure and embed the chat widget on your website.</p>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
          <label style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 600 }}>Target API Key (for embed code)</label>
          <input
            type="password"
            className="input"
            style={{ width: "240px", padding: "6px 12px", height: "auto" }}
            placeholder="Enter API Key to generate code"
            value={apiKey}
            onChange={(e) => { setApiKey(e.target.value); localStorage.setItem("workspaceApiKey", e.target.value); }}
          />
        </div>
      </div>

      <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", overflow: "hidden" }}>
        {currentWorkspaceId ? (
          <WidgetSettings workspaceId={currentWorkspaceId} apiKey={apiKey} />
        ) : (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--text-muted)" }}>
            Please select a workspace first.
          </div>
        )}
      </div>
    </div>
  );
}
