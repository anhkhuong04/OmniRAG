
import { Settings as SettingsIcon, Shield, Server, Bell } from "lucide-react";

export default function Settings() {
  return (
    <div>
      <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ background: "#E0E7FF", padding: "12px", borderRadius: "12px", color: "#4F46E5" }}>
          <SettingsIcon size={24} />
        </div>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#111827", marginBottom: "4px" }}>Platform Settings</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "15px" }}>Manage global configuration and platform-wide defaults.</p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Auth Settings */}
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <Shield size={20} color="#4F46E5" />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}>Authentication</h2>
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>Configure SSO providers, password policies, and session limits for all tenants.</p>
          <button className="btn-secondary" style={{ width: "100%" }}>Configure Auth Provider</button>
        </div>

        {/* Global LLM Defaults */}
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <Server size={20} color="#10B981" />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}>LLM Providers</h2>
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>Manage OpenAI, Anthropic, or local model API keys for the system.</p>
          <button className="btn-secondary" style={{ width: "100%" }}>Manage Providers</button>
        </div>

        {/* Notifications */}
        <div style={{ background: "#fff", borderRadius: "14px", border: "1px solid #E5E7EB", padding: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
            <Bell size={20} color="#F59E0B" />
            <h2 style={{ fontSize: "18px", fontWeight: 600, color: "#111827" }}>System Notifications</h2>
          </div>
          <p style={{ fontSize: "14px", color: "var(--text-muted)", marginBottom: "20px" }}>Set up email templates and SMTP settings for tenant invitations and alerts.</p>
          <button className="btn-secondary" style={{ width: "100%" }}>Email Configuration</button>
        </div>
      </div>
    </div>
  );
}
