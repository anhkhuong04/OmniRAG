import React, { useEffect, useState, useCallback } from "react";
import { adminGetSystemUsage } from "../../services/api";
import type { AdminSystemUsage } from "../../services/api";

export default function SystemUsage() {
  const [usage, setUsage] = useState<AdminSystemUsage | null>(null);

  const fetchUsage = useCallback(async () => {
    try {
      const data = await adminGetSystemUsage();
      setUsage(data);
    } catch (err) {
      console.error(err);
    }
  }, []);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  return (
    <div>
      <div style={{ marginBottom: "32px" }}>
        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "8px" }}>System Usage</h1>
        <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Global usage metrics across all tenants.</p>
      </div>

      {usage ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))", gap: "24px" }}>
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
      ) : (
        <div style={{ color: "var(--text-muted)" }}>Loading system usage...</div>
      )}
    </div>
  );
}
